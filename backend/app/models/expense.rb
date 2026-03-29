class Expense < ApplicationRecord
  include Journalable

  belongs_to :category, class_name: 'ExpenseCategory'
  belongs_to :payment_mode, optional: true
  has_one :attachment, as: :attachable, dependent: :destroy

  validates :date, presence: true
  validates :description, presence: true
  validates :amount, presence: true, numericality: { greater_than: 0 }
end
