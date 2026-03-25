class Product < ApplicationRecord
  belongs_to :default_unit, class_name: 'Unit', optional: true
  has_many :inbound_entries, dependent: :restrict_with_error
  has_many :outbound_entries, dependent: :restrict_with_error
  has_one :stock_item, dependent: :destroy

  enum :category, { paddy: 0, rice: 1, by_product: 2, packaging: 3, other: 4 }
  enum :direction, { inbound: 0, outbound: 1, both: 2 }

  validates :name, presence: true, uniqueness: true
  validates :category, presence: true
  validates :direction, presence: true
end
