class AddOrderReferencesToOutboundEntries < ActiveRecord::Migration[8.0]
  def change
    add_reference :outbound_entries, :order, null: true, foreign_key: true
    add_reference :outbound_entries, :delivery_item, null: true, foreign_key: true
  end
end
