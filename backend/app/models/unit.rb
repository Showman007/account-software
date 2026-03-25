class Unit < ApplicationRecord
  has_many :products, foreign_key: :default_unit_id, dependent: :nullify
  has_many :inbound_entries, dependent: :restrict_with_error
  has_many :outbound_entries, dependent: :restrict_with_error
  has_many :stock_items, dependent: :restrict_with_error

  validates :name, presence: true, uniqueness: true
end
