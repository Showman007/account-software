class AddBagFieldsToEntries < ActiveRecord::Migration[8.0]
  def change
    # Bag type = weight in kg per bag (25, 26, 30, 50, 75)
    # no_of_bags = number of bags
    # qty = quintals (auto-calculated: no_of_bags * bag_type / 100)

    add_column :inbound_entries, :bag_type, :decimal, precision: 5, scale: 1
    add_column :inbound_entries, :no_of_bags, :decimal, precision: 10, scale: 2

    add_column :outbound_entries, :bag_type, :decimal, precision: 5, scale: 1
    add_column :outbound_entries, :no_of_bags, :decimal, precision: 10, scale: 2

    add_column :order_items, :bag_type, :decimal, precision: 5, scale: 1
    add_column :order_items, :no_of_bags, :decimal, precision: 10, scale: 2

    add_column :delivery_items, :bag_type, :decimal, precision: 5, scale: 1
    add_column :delivery_items, :no_of_bags, :decimal, precision: 10, scale: 2
  end
end
