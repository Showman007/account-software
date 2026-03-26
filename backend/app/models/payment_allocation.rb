class PaymentAllocation < ApplicationRecord
  belongs_to :payment
  belongs_to :allocatable, polymorphic: true

  validates :amount, presence: true, numericality: { greater_than: 0 }
  validates :payment_id, uniqueness: { scope: [:allocatable_type, :allocatable_id] }

  scope :for_inbound, -> { where(allocatable_type: 'InboundEntry') }
  scope :for_outbound, -> { where(allocatable_type: 'OutboundEntry') }
  scope :by_bill_date, -> { joins_bill.order('bill_date ASC') }

  # Helper to get the bill amount for display
  def bill_total
    case allocatable_type
    when 'OutboundEntry' then allocatable.total_bill
    when 'InboundEntry' then allocatable.net_amt
    end
  end
end
