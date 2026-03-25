class JournalService
  # Auto-generate journal entry from any transaction record
  def self.create_for(record)
    new(record).create
  end

  # On delete: create a reversal entry (opposite debit/credit) — never destroy
  def self.reverse_for(record)
    new(record).reverse_latest
  end

  # On update: reverse the latest entry, then create a new one with current values
  def self.reverse_and_recreate_for(record)
    new(record).reverse_and_recreate
  end

  # Legacy remove — only used by backfill:clear rake task
  def self.remove_for(record)
    JournalEntry.where(source: record).destroy_all
  end

  # Backfill all existing records
  def self.backfill_all!
    count = 0

    InboundEntry.includes(:party, :product).find_each do |record|
      next if JournalEntry.exists?(source: record)
      create_for(record)
      count += 1
    end

    OutboundEntry.includes(:party, :product).find_each do |record|
      next if JournalEntry.exists?(source: record)
      create_for(record)
      count += 1
    end

    Payment.includes(:party, :payment_mode).find_each do |record|
      next if JournalEntry.exists?(source: record)
      create_for(record)
      count += 1
    end

    Expense.includes(:category, :payment_mode).find_each do |record|
      next if JournalEntry.exists?(source: record)
      create_for(record)
      count += 1
    end

    CreditTransaction.includes(:partner, :payment_mode).find_each do |record|
      next if JournalEntry.exists?(source: record)
      create_for(record)
      count += 1
    end

    MillingBatch.find_each do |record|
      next if JournalEntry.exists?(source: record)
      create_for(record)
      count += 1
    end

    count
  end

  def initialize(record)
    @record = record
  end

  def create
    lines = build_lines
    return nil if lines.empty?

    JournalEntry.create!(
      date: @record.date,
      narration: build_narration,
      entry_type: determine_entry_type,
      source: @record,
      total_amount: lines.sum { |l| l[:debit] },
      journal_lines_attributes: lines
    )
  end

  # Create a reversal entry for the most recent non-reversal journal entry
  def reverse_latest
    latest = find_latest_active_entry
    return nil unless latest

    create_reversal_for(latest)
  end

  # Reverse latest entry, then create a new one with current values
  def reverse_and_recreate
    latest = find_latest_active_entry
    create_reversal_for(latest) if latest
    create
  end

  private

  def find_latest_active_entry
    JournalEntry
      .where(source: @record)
      .where.not(entry_type: :reversal)
      .order(created_at: :desc)
      .first
  end

  def create_reversal_for(original_entry)
    reversed_lines = original_entry.journal_lines.map do |line|
      {
        account_name: line.account_name,
        account_type: line.account_type,
        debit: line.credit,   # swap debit ↔ credit
        credit: line.debit,
        party_id: line.party_id,
        partner_id: line.partner_id
      }
    end

    JournalEntry.create!(
      date: @record.respond_to?(:date) ? @record.date : Date.current,
      narration: "REVERSAL: #{original_entry.narration}",
      entry_type: :reversal,
      source: @record,
      reversed_entry: original_entry,
      total_amount: reversed_lines.sum { |l| l[:debit] },
      journal_lines_attributes: reversed_lines
    )
  end

  def build_lines
    case @record
    when InboundEntry then inbound_lines
    when OutboundEntry then outbound_lines
    when Payment then payment_lines
    when Expense then expense_lines
    when CreditTransaction then credit_transaction_lines
    when MillingBatch then milling_lines
    else []
    end
  end

  def build_narration
    case @record
    when InboundEntry
      "Purchase of #{@record.product&.name} from #{@record.party&.name} - #{@record.net_qty} qty @ #{@record.rate}"
    when OutboundEntry
      "Sale of #{@record.product&.name} to #{@record.party&.name} - #{@record.qty} qty @ #{@record.rate}"
    when Payment
      if @record.payment_to_supplier?
        "Payment to #{@record.party&.name} via #{@record.payment_mode&.name || 'Cash'}"
      else
        "Receipt from #{@record.party&.name} via #{@record.payment_mode&.name || 'Cash'}"
      end
    when Expense
      "Expense: #{@record.description} - #{@record.category&.name}"
    when CreditTransaction
      partner_name = @record.partner&.name
      case @record.transaction_type
      when 'credit_received'
        "Credit received from partner #{partner_name}"
      when 'principal_return'
        "Principal returned to partner #{partner_name}"
      when 'profit_share'
        "Profit share paid to partner #{partner_name}"
      end
    when MillingBatch
      "Milling batch - #{@record.paddy_type} by #{@record.miller_name}"
    else
      "Journal entry"
    end
  end

  def determine_entry_type
    case @record
    when InboundEntry then :purchase
    when OutboundEntry then :sale
    when Payment
      @record.payment_to_supplier? ? :payment_out : :payment_in
    when Expense then :expense
    when CreditTransaction
      case @record.transaction_type
      when 'credit_received' then :credit_received
      when 'principal_return' then :principal_return
      when 'profit_share' then :profit_share
      end
    when MillingBatch then :milling
    else :adjustment
    end
  end

  # ── Line builders ──────────────────────────────────────────

  def inbound_lines
    amount = @record.net_amt.to_f
    return [] if amount.zero?

    [
      {
        account_name: "Purchase - #{@record.product&.name}",
        account_type: :expense,
        debit: amount,
        credit: 0,
        party_id: nil
      },
      {
        account_name: "#{@record.party&.name} (Supplier)",
        account_type: :liability,
        debit: 0,
        credit: amount,
        party_id: @record.party_id
      }
    ]
  end

  def outbound_lines
    amount = @record.total_bill.to_f
    return [] if amount.zero?

    lines = [
      {
        account_name: "#{@record.party&.name} (Buyer)",
        account_type: :asset,
        debit: amount,
        credit: 0,
        party_id: @record.party_id
      },
      {
        account_name: "Sales - #{@record.product&.name}",
        account_type: :income,
        debit: 0,
        credit: @record.amount.to_f,
        party_id: nil
      }
    ]

    # Transport as separate line if present
    if @record.transport.to_f > 0
      lines.last[:credit] = @record.amount.to_f
      lines << {
        account_name: "Transport Income",
        account_type: :income,
        debit: 0,
        credit: @record.transport.to_f,
        party_id: nil
      }
    end

    lines
  end

  def payment_lines
    amount = @record.amount.to_f
    return [] if amount.zero?

    mode_name = @record.payment_mode&.name || 'Cash'

    if @record.payment_to_supplier?
      [
        {
          account_name: "#{@record.party&.name} (Supplier)",
          account_type: :liability,
          debit: amount,
          credit: 0,
          party_id: @record.party_id
        },
        {
          account_name: mode_name,
          account_type: :asset,
          debit: 0,
          credit: amount,
          party_id: nil
        }
      ]
    else
      [
        {
          account_name: mode_name,
          account_type: :asset,
          debit: amount,
          credit: 0,
          party_id: nil
        },
        {
          account_name: "#{@record.party&.name} (Buyer)",
          account_type: :asset,
          debit: 0,
          credit: amount,
          party_id: @record.party_id
        }
      ]
    end
  end

  def expense_lines
    amount = @record.amount.to_f
    return [] if amount.zero?

    mode_name = @record.payment_mode&.name || 'Cash'

    [
      {
        account_name: "#{@record.category&.name}",
        account_type: :expense,
        debit: amount,
        credit: 0,
        party_id: nil
      },
      {
        account_name: mode_name,
        account_type: :asset,
        debit: 0,
        credit: amount,
        party_id: nil
      }
    ]
  end

  def credit_transaction_lines
    mode_name = @record.payment_mode&.name || 'Cash'
    partner_name = @record.partner&.name

    case @record.transaction_type
    when 'credit_received'
      amount = @record.credit_received.to_f
      return [] if amount.zero?
      [
        {
          account_name: mode_name,
          account_type: :asset,
          debit: amount,
          credit: 0,
          partner_id: nil
        },
        {
          account_name: "#{partner_name} (Partner Capital)",
          account_type: :liability,
          debit: 0,
          credit: amount,
          partner_id: @record.partner_id
        }
      ]
    when 'principal_return'
      amount = @record.principal_returned.to_f
      return [] if amount.zero?
      [
        {
          account_name: "#{partner_name} (Partner Capital)",
          account_type: :liability,
          debit: amount,
          credit: 0,
          partner_id: @record.partner_id
        },
        {
          account_name: mode_name,
          account_type: :asset,
          debit: 0,
          credit: amount,
          partner_id: nil
        }
      ]
    when 'profit_share'
      amount = @record.profit_paid.to_f
      return [] if amount.zero?
      [
        {
          account_name: "Profit Share - #{partner_name}",
          account_type: :expense,
          debit: amount,
          credit: 0,
          partner_id: @record.partner_id
        },
        {
          account_name: mode_name,
          account_type: :asset,
          debit: 0,
          credit: amount,
          partner_id: nil
        }
      ]
    else
      []
    end
  end

  def milling_lines
    cost = @record.milling_cost.to_f
    return [] if cost.zero?

    [
      {
        account_name: "Milling Cost",
        account_type: :expense,
        debit: cost,
        credit: 0
      },
      {
        account_name: "Cash",
        account_type: :asset,
        debit: 0,
        credit: cost
      }
    ]
  end
end
