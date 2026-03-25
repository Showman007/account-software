class MasterLedgerService
  def initialize(from_date: nil, to_date: nil)
    @from_date = from_date
    @to_date = to_date
  end

  def call
    {
      buyers_who_owe_us: buyers_ledger,
      suppliers_we_owe: suppliers_ledger
    }
  end

  private

  def date_scope(scope)
    scope = scope.where('date >= ?', @from_date) if @from_date
    scope = scope.where('date <= ?', @to_date) if @to_date
    scope
  end

  def buyers_ledger
    buyer_parties = Party.where(party_type: [:buyer, :both])

    buyer_parties.map do |party|
      outbound = date_scope(OutboundEntry.where(party_id: party.id))
      payments_received = date_scope(Payment.active.where(party_id: party.id, direction: :receipt_from_buyer))

      total_billed = outbound.sum(:total_bill)
      # Only use payments table as source of truth for received amounts.
      # outbound.received is an advance/inline field — already included via payments if a payment record was created.
      total_received = payments_received.sum(:amount)
      balance = total_billed - total_received

      {
        party_id: party.id,
        party_name: party.name,
        village_city: party.village_city,
        total_billed: total_billed,
        total_received: total_received,
        balance: balance
      }
    end.select { |entry| entry[:total_billed] > 0 || entry[:balance] != 0 }
  end

  def suppliers_ledger
    supplier_parties = Party.where(party_type: [:supplier, :both])

    supplier_parties.map do |party|
      inbound = date_scope(InboundEntry.where(party_id: party.id))
      payments_made = date_scope(Payment.active.where(party_id: party.id, direction: :payment_to_supplier))

      total_purchased = inbound.sum(:net_amt)
      # Only use payments table as source of truth for paid amounts.
      # inbound.paid is an advance/inline field — already included via payments if a payment record was created.
      total_paid = payments_made.sum(:amount)
      balance = total_purchased - total_paid

      {
        party_id: party.id,
        party_name: party.name,
        village_city: party.village_city,
        total_purchased: total_purchased,
        total_paid: total_paid,
        balance: balance
      }
    end.select { |entry| entry[:total_purchased] > 0 || entry[:balance] != 0 }
  end
end
