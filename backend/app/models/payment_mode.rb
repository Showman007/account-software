class PaymentMode < ApplicationRecord
  has_many :expenses, dependent: :nullify
  has_many :payments, dependent: :nullify
  has_many :credit_transactions, dependent: :nullify

  validates :name, presence: true, uniqueness: true
end
