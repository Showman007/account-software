class DeliveryItem < ApplicationRecord
  include BagCalculable

  belongs_to :delivery
  belongs_to :order_item
  belongs_to :product
  belongs_to :unit

  has_one :outbound_entry, dependent: :nullify
  has_many :credit_note_items, dependent: :restrict_with_error

  validates :qty, presence: true, numericality: { greater_than: 0 }

  def returnable_qty
    returned = credit_note_items.sum(:qty)
    qty - returned
  end
end
