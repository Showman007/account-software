class Partner < ApplicationRecord
  has_many :credit_transactions, dependent: :restrict_with_error

  enum :profit_share_type, { percentage: 0, fixed: 1 }
  enum :status, { active: 0, inactive: 1 }

  validates :name, presence: true
  validates :profit_share_rate, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
end
