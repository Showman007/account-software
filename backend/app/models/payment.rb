class Payment < ApplicationRecord
  include Journalable

  belongs_to :party
  belongs_to :payment_mode, optional: true

  # Reversal tracking
  belongs_to :reversed_payment, class_name: 'Payment', optional: true
  has_one :reversal_entry, class_name: 'Payment', foreign_key: :reversed_payment_id

  enum :direction, { payment_to_supplier: 0, receipt_from_buyer: 1 }

  validates :date, presence: true
  validates :direction, presence: true
  validates :amount, presence: true, numericality: { greater_than: 0 }

  scope :active, -> { where(reversed: false) }

  def reverse!
    raise "Payment already reversed" if reversed?

    opposite_direction = payment_to_supplier? ? :receipt_from_buyer : :payment_to_supplier

    reversal = Payment.create!(
      date: Date.current,
      party_id: party_id,
      direction: opposite_direction,
      amount: amount,
      payment_mode_id: payment_mode_id,
      reference: reference.present? ? "REV:#{reference}" : nil,
      remarks: "REVERSAL of Payment ##{id}: #{remarks}",
      reversed: true,
      reversed_payment: self
    )

    update!(reversed: true)
    reversal
  end

  def is_reversal?
    reversed_payment_id.present?
  end
end
