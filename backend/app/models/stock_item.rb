class StockItem < ApplicationRecord
  belongs_to :product
  belongs_to :unit

  enum :status, { in_stock: 0, low: 1, out_of_stock: 2 }

  validates :product_id, uniqueness: true

  before_validation :calculate_fields

  private

  def calculate_fields
    self.current_stock = (opening_stock || 0) +
                         (total_inbound || 0) +
                         (from_milling || 0) -
                         (total_outbound || 0)

    if current_stock <= 0
      self.status = :out_of_stock
    elsif current_stock <= (min_level || 0)
      self.status = :low
    else
      self.status = :in_stock
    end
  end
end
