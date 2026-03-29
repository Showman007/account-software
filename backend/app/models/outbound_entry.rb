class OutboundEntry < ApplicationRecord
  include Journalable
  include AutoPayment

  belongs_to :party
  belongs_to :product
  belongs_to :unit

  has_many :payment_allocations, as: :allocatable, dependent: :destroy
  has_one :attachment, as: :attachable, dependent: :destroy

  validates :date, presence: true
  validates :qty, presence: true, numericality: { greater_than: 0 }
  validates :rate, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :received, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validates :transport, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true

  before_validation :calculate_fields

  private

  def calculate_fields
    return unless qty.present? && rate.present?

    self.amount = qty * rate
    self.total_bill = amount + (transport || 0)
    self.balance = total_bill - (received || 0)
  end

  # AutoPayment overrides
  def payment_amount
    received.to_f
  end

  def payment_direction
    :receipt_from_buyer
  end
end
