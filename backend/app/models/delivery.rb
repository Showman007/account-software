class Delivery < ApplicationRecord
  belongs_to :order

  has_many :delivery_items, dependent: :destroy
  has_many :outbound_entries, through: :delivery_items
  has_many :order_credit_notes, dependent: :restrict_with_error

  accepts_nested_attributes_for :delivery_items, allow_destroy: true

  enum :status, {
    pending: 0,
    in_transit: 1,
    delivered: 2
  }

  validates :delivery_number, presence: true, uniqueness: true
  validates :date, presence: true
  validates :status, presence: true
  validates :transport, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true

  before_validation :generate_delivery_number, on: :create

  validate :order_must_be_deliverable
  validate :items_within_order_quantities, on: :create

  private

  def generate_delivery_number
    return if delivery_number.present?

    last = Delivery.order(id: :desc).pick(:delivery_number)
    seq = last ? last.scan(/\d+$/).first.to_i + 1 : 1
    self.delivery_number = "DLV-#{seq.to_s.rjust(5, '0')}"
  end

  def order_must_be_deliverable
    return unless order

    unless order.deliverable?
      errors.add(:order, "is not in a deliverable status (current: #{order.status})")
    end
  end

  def items_within_order_quantities
    return unless delivery_items.any?

    delivery_items.each do |di|
      next unless di.order_item

      available = di.order_item.deliverable_qty
      if di.qty > available
        errors.add(:base, "#{di.product&.name}: delivery qty (#{di.qty}) exceeds available qty (#{available})")
      end
    end
  end
end
