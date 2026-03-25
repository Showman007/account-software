class PartyLedgerService
  def initialize(party:, from_date: nil, to_date: nil)
    @party = party
    @from_date = from_date
    @to_date = to_date
  end

  def call
    {
      party: PartySerializer.render_as_hash(@party),
      summary: summary,
      transactions: transaction_history
    }
  end

  private

  def date_scope(scope)
    scope = scope.where('date >= ?', @from_date) if @from_date
    scope = scope.where('date <= ?', @to_date) if @to_date
    scope
  end

  def inbound_entries
    @inbound_entries ||= date_scope(InboundEntry.where(party_id: @party.id))
  end

  def outbound_entries
    @outbound_entries ||= date_scope(OutboundEntry.where(party_id: @party.id))
  end

  def payments
    # Only include active (non-reversed) payments in ledger
    @payments ||= date_scope(Payment.where(party_id: @party.id).active)
  end

  def summary
    {
      total_inbound_amount: inbound_entries.sum(:net_amt),
      total_inbound_paid: inbound_entries.sum(:paid),
      total_outbound_amount: outbound_entries.sum(:total_bill),
      total_outbound_received: outbound_entries.sum(:received),
      total_payments_to_supplier: payments.where(direction: :payment_to_supplier).sum(:amount),
      total_receipts_from_buyer: payments.where(direction: :receipt_from_buyer).sum(:amount),
      opening_balance: @party.opening_balance || 0
    }
  end

  def transaction_history
    entries = []

    inbound_entries.order(:date).each do |e|
      entries << {
        type: 'inbound',
        date: e.date,
        description: "Purchase - #{e.product&.name}",
        qty: e.qty,
        amount: e.net_amt,
        paid: e.paid,
        balance: e.balance
      }
    end

    outbound_entries.order(:date).each do |e|
      entries << {
        type: 'outbound',
        date: e.date,
        description: "Sale - #{e.product&.name}",
        qty: e.qty,
        amount: e.total_bill,
        received: e.received,
        balance: e.balance
      }
    end

    payments.includes(:payment_mode).order(:date).each do |p|
      entries << {
        type: 'payment',
        date: p.date,
        description: p.payment_to_supplier? ? 'Payment to supplier' : 'Receipt from buyer',
        amount: p.amount,
        payment_mode: p.payment_mode&.name,
        reference: p.reference
      }
    end

    entries.sort_by { |e| e[:date] }
  end
end
