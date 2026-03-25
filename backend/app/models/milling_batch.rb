class MillingBatch < ApplicationRecord
  include Journalable

  validates :date, presence: true
  validates :input_qty, presence: true, numericality: { greater_than: 0 }
  validates :milling_cost, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true

  before_validation :calculate_fields

  private

  def calculate_fields
    self.total_output = (rice_main_qty || 0) +
                        (broken_rice_qty || 0) +
                        (rice_bran_qty || 0) +
                        (husk_qty || 0) +
                        (rice_flour_qty || 0)
    self.loss_diff = (input_qty || 0) - total_output
  end
end
