class OrderCreditNote < ApplicationRecord
  belongs_to :order
  belongs_to :delivery

  has_many :credit_note_items, dependent: :destroy

  accepts_nested_attributes_for :credit_note_items, allow_destroy: true

  validates :credit_note_number, presence: true, uniqueness: true
  validates :date, presence: true

  before_validation :generate_credit_note_number, on: :create
  before_validation :calculate_total

  validate :items_within_delivered_quantities, on: :create

  private

  def generate_credit_note_number
    return if credit_note_number.present?

    last = OrderCreditNote.order(id: :desc).pick(:credit_note_number)
    seq = last ? last.scan(/\d+$/).first.to_i + 1 : 1
    self.credit_note_number = "CN-#{seq.to_s.rjust(5, '0')}"
  end

  def calculate_total
    return unless credit_note_items.any?

    self.total_amount = credit_note_items.reject(&:marked_for_destruction?).sum { |item| item.qty.to_d * item.rate.to_d }
  end

  def items_within_delivered_quantities
    return unless credit_note_items.any?

    credit_note_items.each do |cni|
      next unless cni.delivery_item

      available = cni.delivery_item.returnable_qty
      if cni.qty > available
        errors.add(:base, "#{cni.product&.name}: return qty (#{cni.qty}) exceeds returnable qty (#{available})")
      end
    end
  end
end
