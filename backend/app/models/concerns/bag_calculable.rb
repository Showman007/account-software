module BagCalculable
  extend ActiveSupport::Concern

  BAG_TYPES = [25, 26, 30, 50, 75].freeze

  # How many kg in 1 unit of each weight-based unit
  # bags → qty conversion: qty = (no_of_bags × bag_type_kg) / factor
  # qty → bags conversion: no_of_bags = (qty × factor) / bag_type_kg
  UNIT_KG_FACTORS = {
    "Quintals" => 100,
    "Kgs"      => 1,
    "Tonnes"   => 1000
  }.freeze

  # Count-based units where qty = no_of_bags directly
  COUNT_UNITS = %w[Bags Nos].freeze

  included do
    validates :bag_type, inclusion: { in: BAG_TYPES.map(&:to_d), message: "must be one of #{BAG_TYPES.join(', ')} kg" }, allow_nil: true
    validates :no_of_bags, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true

    before_validation :sync_bag_and_qty
  end

  private

  def sync_bag_and_qty
    return unless bag_type.present? && bag_type > 0
    return unless respond_to?(:unit) && unit.present?

    unit_name = unit.name

    if COUNT_UNITS.include?(unit_name)
      sync_count_unit
    elsif UNIT_KG_FACTORS.key?(unit_name)
      sync_weight_unit(UNIT_KG_FACTORS[unit_name])
    end
    # For unknown units (e.g. Litres), no automatic sync
  end

  # Count-based units (Bags, Nos): qty = no_of_bags
  def sync_count_unit
    if no_of_bags_changed_or_set? && no_of_bags.present? && no_of_bags > 0
      self.qty = no_of_bags
    elsif qty.present? && qty > 0 && (no_of_bags.blank? || no_of_bags.zero?)
      self.no_of_bags = qty
    end
  end

  # Weight-based units: convert using bag_type_kg and the unit's kg factor
  def sync_weight_unit(kg_per_unit)
    if no_of_bags_changed_or_set? && no_of_bags.present? && no_of_bags > 0
      # bags → qty: total_kg / kg_per_unit
      self.qty = (no_of_bags * bag_type / kg_per_unit.to_d).round(3)
    elsif qty.present? && qty > 0 && (no_of_bags.blank? || no_of_bags.zero?)
      # qty → bags: (qty × kg_per_unit) / bag_type_kg
      self.no_of_bags = (qty * kg_per_unit / bag_type).round(2)
    end
  end

  def no_of_bags_changed_or_set?
    new_record? ? no_of_bags.present? : no_of_bags_changed?
  end
end
