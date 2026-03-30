class CreditNoteItem < ApplicationRecord
  belongs_to :order_credit_note
  belongs_to :delivery_item
  belongs_to :product
  belongs_to :unit

  validates :qty, presence: true, numericality: { greater_than: 0 }
  validates :rate, presence: true, numericality: { greater_than_or_equal_to: 0 }

  before_validation :calculate_amount

  private

  def calculate_amount
    return unless qty.present? && rate.present?

    self.amount = qty * rate
  end
end
