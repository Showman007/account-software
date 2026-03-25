class JournalLine < ApplicationRecord
  belongs_to :journal_entry
  belongs_to :party, optional: true
  belongs_to :partner, optional: true

  enum :account_type, {
    asset: 0,       # Cash, Bank, Receivables
    liability: 1,   # Payables, Partner Capital
    income: 2,      # Sales
    expense: 3,     # Purchases, Operating Expenses
    equity: 4       # Owner's Capital
  }

  validates :account_name, presence: true
  validates :debit, numericality: { greater_than_or_equal_to: 0 }
  validates :credit, numericality: { greater_than_or_equal_to: 0 }
  validate :debit_or_credit_present

  private

  def debit_or_credit_present
    if debit.to_f.zero? && credit.to_f.zero?
      errors.add(:base, "Either debit or credit must be greater than 0")
    end

    if debit.to_f > 0 && credit.to_f > 0
      errors.add(:base, "A line cannot have both debit and credit")
    end
  end
end
