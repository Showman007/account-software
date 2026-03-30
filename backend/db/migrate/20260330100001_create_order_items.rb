class CreateOrderItems < ActiveRecord::Migration[8.0]
  def change
    create_table :order_items do |t|
      t.references :order, null: false, foreign_key: true
      t.references :product, null: false, foreign_key: true
      t.string :category
      t.decimal :qty, precision: 12, scale: 3, null: false
      t.references :unit, null: false, foreign_key: true
      t.decimal :rate, precision: 12, scale: 2, null: false
      t.decimal :amount, precision: 15, scale: 2, default: "0.0", null: false
      t.decimal :delivered_qty, precision: 12, scale: 3, default: "0.0"
      t.decimal :returned_qty, precision: 12, scale: 3, default: "0.0"
      t.decimal :pending_qty, precision: 12, scale: 3, default: "0.0"

      t.timestamps
    end

    add_index :order_items, [:order_id, :product_id]
  end
end
