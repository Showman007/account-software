class InboundEntry < ApplicationRecord
  include Journalable
  include AutoPayment

  belongs_to :party
  belongs_to :product
  belongs_to :unit

  has_many :payment_allocations, as: :allocatable, dependent: :destroy

  validates :date, presence: true
  validates :qty, presence: true, numericality: { greater_than: 0 }
  validates :rate, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :moisture_pct, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 100 }, allow_nil: true
  validates :paid, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true

  before_validation :calculate_fields

  private

  def calculate_fields
    return unless qty.present? && rate.present?

    self.gross_amt = qty * rate
    pct = moisture_pct || 0
    self.deduction_amt = gross_amt * pct / 100
    self.net_qty = qty * (1 - pct / 100.0)
    self.net_amt = gross_amt - deduction_amt
    self.balance = net_amt - (paid || 0)
  end

  # AutoPayment overrides
  def payment_amount
    paid.to_f
  end

  def payment_direction
    :payment_to_supplier
  end
end
