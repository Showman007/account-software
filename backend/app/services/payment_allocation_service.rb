# PaymentAllocationService
# Handles FIFO allocation of payments to bills and LIFO deallocation on reversal.
#
# For buyer payments (receipt_from_buyer):
#   Allocates against OutboundEntry bills (oldest unpaid first)
#
# For supplier payments (payment_to_supplier):
#   Allocates against InboundEntry bills (oldest unpaid first)
#
class PaymentAllocationService
  class << self
    # Allocate a payment to outstanding bills (FIFO — oldest first)
    def allocate(payment)
      return if payment.is_reversal?        # reversal entries don't get allocated
      return if payment.reversed?           # already-reversed payments don't get re-allocated

      remaining = payment.amount
      bills = outstanding_bills_for(payment)

      bills.each do |bill|
        break if remaining <= 0

        bill_balance = bill_outstanding(bill)
        next if bill_balance <= 0

        alloc_amount = [remaining, bill_balance].min

        PaymentAllocation.create!(
          payment: payment,
          allocatable: bill,
          amount: alloc_amount
        )

        remaining -= alloc_amount

        # Update the balance field on the bill
        recalculate_bill_balance!(bill)
      end
    end

    # Deallocate a payment's allocations (called before reversal)
    # Removes all allocations for this payment and recalculates bill balances
    def deallocate(payment)
      allocations = payment.payment_allocations.includes(:allocatable)

      # Collect affected bills before deleting
      affected_bills = allocations.map(&:allocatable).compact

      # Remove all allocations for this payment
      allocations.destroy_all

      # Recalculate balance for each affected bill
      affected_bills.each { |bill| recalculate_bill_balance!(bill) }
    end

    # Re-allocate all payments for a party (used in backfill)
    # Clears existing allocations and re-does FIFO from scratch
    def reallocate_party(party)
      # Clear existing allocations for this party's payments
      payment_ids = Payment.where(party_id: party.id).pluck(:id)
      PaymentAllocation.where(payment_id: payment_ids).delete_all

      # Get all active, non-reversal payments ordered by date (FIFO)
      payments = Payment.where(party_id: party.id)
                       .active
                       .where(reversed_payment_id: nil)
                       .order(:date, :id)

      # Process buyer payments (receipt_from_buyer → OutboundEntry)
      buyer_payments = payments.where(direction: :receipt_from_buyer)
      allocate_payment_batch(buyer_payments, outbound_bills_for_party(party))

      # Process supplier payments (payment_to_supplier → InboundEntry)
      supplier_payments = payments.where(direction: :payment_to_supplier)
      allocate_payment_batch(supplier_payments, inbound_bills_for_party(party))

      # Recalculate all bill balances for this party
      recalculate_all_bills_for_party(party)
    end

    # Backfill all parties
    def backfill_all
      count = 0
      Party.find_each do |party|
        reallocate_party(party)
        count += 1
      end
      count
    end

    private

    # Get outstanding bills for a payment (FIFO — oldest first)
    def outstanding_bills_for(payment)
      if payment.receipt_from_buyer?
        outbound_bills_for_party_with_balance(payment.party)
      elsif payment.payment_to_supplier?
        inbound_bills_for_party_with_balance(payment.party)
      else
        []
      end
    end

    def outbound_bills_for_party(party)
      OutboundEntry.where(party_id: party.id).order(:date, :id)
    end

    def inbound_bills_for_party(party)
      InboundEntry.where(party_id: party.id).order(:date, :id)
    end

    def outbound_bills_for_party_with_balance(party)
      # Bills ordered by date (oldest first), only those with outstanding balance
      OutboundEntry.where(party_id: party.id)
                   .order(:date, :id)
                   .select { |b| bill_outstanding(b) > 0 }
    end

    def inbound_bills_for_party_with_balance(party)
      InboundEntry.where(party_id: party.id)
                  .order(:date, :id)
                  .select { |b| bill_outstanding(b) > 0 }
    end

    # Calculate how much is still unpaid on a bill
    def bill_outstanding(bill)
      total = bill_total(bill)
      allocated = PaymentAllocation.where(allocatable: bill).sum(:amount)
      total - allocated
    end

    def bill_total(bill)
      case bill
      when OutboundEntry then bill.total_bill
      when InboundEntry then bill.net_amt
      else 0
      end
    end

    # Batch allocate: iterate payments and allocate against bills in FIFO order
    def allocate_payment_batch(payments, bills)
      bill_list = bills.to_a
      bill_remaining = bill_list.map { |b| [b, bill_total(b).to_f] }.to_h

      payments.each do |payment|
        remaining = payment.amount.to_f

        bill_list.each do |bill|
          break if remaining <= 0
          next if bill_remaining[bill].to_f <= 0

          alloc_amount = [remaining, bill_remaining[bill]].min

          PaymentAllocation.create!(
            payment: payment,
            allocatable: bill,
            amount: alloc_amount
          )

          remaining -= alloc_amount
          bill_remaining[bill] -= alloc_amount
        end
      end
    end

    # Recalculate the `balance` column on a bill based on its allocations
    def recalculate_bill_balance!(bill)
      total_allocated = PaymentAllocation.where(allocatable: bill).sum(:amount)

      case bill
      when OutboundEntry
        new_balance = bill.total_bill - total_allocated
        bill.update_column(:balance, new_balance)
        bill.update_column(:received, total_allocated)
      when InboundEntry
        new_balance = bill.net_amt - total_allocated
        bill.update_column(:balance, new_balance)
        bill.update_column(:paid, total_allocated)
      end
    end

    def recalculate_all_bills_for_party(party)
      OutboundEntry.where(party_id: party.id).find_each do |bill|
        recalculate_bill_balance!(bill)
      end

      InboundEntry.where(party_id: party.id).find_each do |bill|
        recalculate_bill_balance!(bill)
      end
    end
  end
end
