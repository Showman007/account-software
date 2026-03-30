module BagCalculable
  extend ActiveSupport::Concern

  BAG_TYPES = [25, 26, 30, 50, 75].freeze

  included do
    validates :bag_type, inclusion: { in: BAG_TYPES.map(&:to_d), message: "must be one of #{BAG_TYPES.join(', ')} kg" }, allow_nil: true
    validates :no_of_bags, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true

    before_validation :sync_bag_and_qty
  end

  private

  # Two-way sync:
  # - If no_of_bags + bag_type are provided → calculate qty (quintals)
  # - If qty is provided without no_of_bags but with bag_type → calculate no_of_bags
  def sync_bag_and_qty
    return unless bag_type.present? && bag_type > 0

    if no_of_bags_changed_or_set? && no_of_bags.present? && no_of_bags > 0
      # bags → quintals: (no_of_bags × bag_type_kg) / 100
      self.qty = (no_of_bags * bag_type / 100.0).round(3)
    elsif qty.present? && qty > 0 && (no_of_bags.blank? || no_of_bags.zero?)
      # quintals → bags: (qty × 100) / bag_type_kg
      self.no_of_bags = (qty * 100 / bag_type).round(2)
    end
  end

  def no_of_bags_changed_or_set?
    new_record? ? no_of_bags.present? : no_of_bags_changed?
  end
end
