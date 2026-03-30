class OrderItem < ApplicationRecord
  include BagCalculable

  belongs_to :order
  belongs_to :product
  belongs_to :unit

  has_many :delivery_items, dependent: :restrict_with_error

  validates :qty, presence: true, numericality: { greater_than: 0 }
  validates :rate, presence: true, numericality: { greater_than_or_equal_to: 0 }

  before_validation :calculate_fields

  def deliverable_qty
    qty - delivered_qty + returned_qty
  end

  def fully_delivered?
    deliverable_qty <= 0
  end

  # Called when a delivery is completed or a credit note is issued
  def recalculate_quantities!
    self.delivered_qty = delivery_items.joins(:delivery)
                                       .where(deliveries: { status: :delivered })
                                       .sum(:qty)
    self.returned_qty = CreditNoteItem.joins(:order_credit_note)
                                       .joins(:delivery_item)
                                       .where(delivery_items: { order_item_id: id })
                                       .sum(:qty)
    self.pending_qty = qty - delivered_qty + returned_qty
    save!
  end

  private

  def calculate_fields
    return unless qty.present? && rate.present?

    self.amount = qty * rate
    self.pending_qty = qty - (delivered_qty || 0) + (returned_qty || 0)
  end
end
