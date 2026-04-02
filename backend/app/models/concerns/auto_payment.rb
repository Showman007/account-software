module AutoPayment
  extend ActiveSupport::Concern

  included do
    after_create_commit :create_auto_payment
    after_update_commit :sync_auto_payment
    before_destroy :remove_auto_payment
  end

  private

  def payment_amount
    0 # Override in including model
  end

  def payment_direction
    :payment_to_supplier # Override in including model
  end

  def auto_payment_reference
    "auto:#{self.class.name}:#{id}"
  end

  def find_auto_payment
    Payment.find_by(reference: auto_payment_reference)
  end

  def create_auto_payment
    return unless payment_amount.to_f > 0
    build_and_save_payment
  end

  # Update in-place — the Journalable concern on Payment handles
  # the journal reversal audit trail automatically on update/destroy
  def sync_auto_payment
    existing = find_auto_payment

    if payment_amount.to_f > 0
      if existing
        # Deallocate old allocations before updating amount
        PaymentAllocationService.deallocate(existing)
        existing.update!(
          date: date,
          party_id: party_id,
          direction: payment_direction,
          amount: payment_amount
        )
        # Re-allocate directly to this entry (not FIFO)
        PaymentAllocationService.allocate_to_entry(existing, self)
      else
        build_and_save_payment
      end
    elsif existing
      PaymentAllocationService.deallocate(existing)
      existing.destroy!
    end
  end

  def remove_auto_payment
    existing = find_auto_payment
    if existing
      PaymentAllocationService.deallocate(existing)
      existing.destroy!
    end
  end

  def build_and_save_payment
    payment = Payment.new(
      date: date,
      party_id: party_id,
      direction: payment_direction,
      amount: payment_amount,
      reference: auto_payment_reference,
      remarks: "Auto: #{self.class.name.underscore.humanize} ##{id}"
    )
    # Tell the payment to allocate directly to this entry, not FIFO
    payment.source_entry = self
    payment.save!
    payment
  end
end
