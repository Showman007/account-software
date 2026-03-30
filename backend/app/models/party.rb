class Party < ApplicationRecord
  has_many :inbound_entries, dependent: :restrict_with_error
  has_many :outbound_entries, dependent: :restrict_with_error
  has_many :payments, dependent: :restrict_with_error
  has_many :orders, dependent: :restrict_with_error

  enum :party_type, { supplier: 0, buyer: 1, both: 2 }

  validates :name, presence: true
  validates :party_type, presence: true
  validates :opening_balance, numericality: true, allow_nil: true
end
