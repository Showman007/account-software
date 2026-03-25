class CreditTransaction < ApplicationRecord
  include Journalable

  belongs_to :partner
  belongs_to :payment_mode, optional: true

  enum :transaction_type, { credit_received: 0, principal_return: 1, profit_share: 2 }

  validates :date, presence: true
  validates :transaction_type, presence: true
  validates :credit_received, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validates :principal_returned, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validates :profit_paid, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true

  before_validation :calculate_running_balance

  private

  def calculate_running_balance
    previous = self.class.where(partner_id: partner_id)
                         .where.not(id: id)
                         .order(date: :desc, created_at: :desc)
                         .first

    prev_balance = previous&.running_balance || 0
    self.running_balance = prev_balance +
                           (credit_received || 0) -
                           (principal_returned || 0) -
                           (profit_paid || 0)
  end
end
