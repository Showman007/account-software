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
      transactions: transaction_history,
      bill_summary: bill_summary
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

    inbound_entries.includes(:product, :payment_allocations).order(:date).each do |e|
      entries << {
        type: 'inbound',
        id: e.id,
        date: e.date,
        description: "Purchase - #{e.product&.name}",
        qty: e.qty,
        amount: e.net_amt,
        paid: e.paid,
        balance: e.balance,
        allocations: e.payment_allocations.map { |a| { payment_id: a.payment_id, amount: a.amount } }
      }
    end

    outbound_entries.includes(:product, :payment_allocations).order(:date).each do |e|
      entries << {
        type: 'outbound',
        id: e.id,
        date: e.date,
        description: "Sale - #{e.product&.name}",
        qty: e.qty,
        amount: e.total_bill,
        received: e.received,
        balance: e.balance,
        allocations: e.payment_allocations.map { |a| { payment_id: a.payment_id, amount: a.amount } }
      }
    end

    payments.includes(:payment_mode, :payment_allocations).order(:date).each do |p|
      entries << {
        type: 'payment',
        id: p.id,
        date: p.date,
        description: if p.is_reversal?
                       p.payment_to_supplier? ? 'Refund to supplier' : 'Refund from buyer'
                     elsif p.payment_to_supplier?
                       'Payment to supplier'
                     else
                       'Receipt from buyer'
                     end,
        amount: p.amount,
        payment_mode: p.payment_mode&.name,
        reference: p.reference,
        allocations: p.payment_allocations.map { |a|
          { bill_type: a.allocatable_type.underscore.humanize, bill_id: a.allocatable_id, amount: a.amount }
        }
      }
    end

    entries.sort_by { |e| [e[:date], e[:id] || 0] }
  end

  # Bill-level summary: each bill with its payment allocation breakdown
  def bill_summary
    bills = []

    outbound_entries.includes(:product, payment_allocations: { payment: :payment_mode }).order(:date, :id).each do |e|
      bills << {
        type: 'outbound',
        id: e.id,
        date: e.date,
        product: e.product&.name,
        bill_amount: e.total_bill,
        total_allocated: e.payment_allocations.sum(&:amount),
        balance: e.balance,
        status: e.balance.to_f <= 0 ? 'cleared' : 'pending',
        payments: e.payment_allocations.map { |a|
          {
            payment_id: a.payment_id,
            date: a.payment.date,
            amount: a.amount,
            reference: a.payment.reference,
            mode: a.payment.payment_mode&.name
          }
        }
      }
    end

    inbound_entries.includes(:product, payment_allocations: { payment: :payment_mode }).order(:date, :id).each do |e|
      bills << {
        type: 'inbound',
        id: e.id,
        date: e.date,
        product: e.product&.name,
        bill_amount: e.net_amt,
        total_allocated: e.payment_allocations.sum(&:amount),
        balance: e.balance,
        status: e.balance.to_f <= 0 ? 'cleared' : 'pending',
        payments: e.payment_allocations.map { |a|
          {
            payment_id: a.payment_id,
            date: a.payment.date,
            amount: a.amount,
            reference: a.payment.reference,
            mode: a.payment.payment_mode&.name
          }
        }
      }
    end

    bills
  end
end
