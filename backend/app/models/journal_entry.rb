class JournalEntry < ApplicationRecord
  has_many :journal_lines, dependent: :destroy
  belongs_to :source, polymorphic: true, optional: true

  # Reversal audit trail
  belongs_to :reversed_entry, class_name: 'JournalEntry', optional: true
  has_one :reversal, class_name: 'JournalEntry', foreign_key: :reversed_entry_id

  enum :entry_type, {
    purchase: 0,
    sale: 1,
    payment_out: 2,
    payment_in: 3,
    expense: 4,
    credit_received: 5,
    principal_return: 6,
    profit_share: 7,
    milling: 8,
    adjustment: 9,
    reversal: 10
  }

  validates :entry_number, presence: true, uniqueness: true
  validates :date, presence: true
  validates :narration, presence: true
  validate :debits_equal_credits

  before_validation :generate_entry_number, on: :create

  accepts_nested_attributes_for :journal_lines

  scope :by_date_range, ->(from, to) {
    scope = all
    scope = scope.where('date >= ?', from) if from.present?
    scope = scope.where('date <= ?', to) if to.present?
    scope
  }

  scope :by_type, ->(type) { where(entry_type: type) if type.present? }

  private

  def generate_entry_number
    return if entry_number.present?

    last = self.class.order(created_at: :desc).pick(:entry_number)
    next_num = if last.present?
                 last.gsub('JE-', '').to_i + 1
               else
                 1
               end
    self.entry_number = "JE-#{next_num.to_s.rjust(5, '0')}"
  end

  def debits_equal_credits
    return if journal_lines.empty?

    total_debit = journal_lines.sum(&:debit)
    total_credit = journal_lines.sum(&:credit)

    unless (total_debit - total_credit).abs < 0.01
      errors.add(:base, "Total debits (#{total_debit}) must equal total credits (#{total_credit})")
    end
  end
end
