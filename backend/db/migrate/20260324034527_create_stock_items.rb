class CreateStockItems < ActiveRecord::Migration[8.0]
  def change
    create_table :stock_items do |t|
      t.references :product, null: false, foreign_key: true, index: { unique: true }
      t.string :category
      t.references :unit, null: false, foreign_key: true
      t.decimal :opening_stock, precision: 12, scale: 3, default: 0
      t.decimal :total_inbound, precision: 12, scale: 3, default: 0
      t.decimal :from_milling, precision: 12, scale: 3, default: 0
      t.decimal :total_outbound, precision: 12, scale: 3, default: 0
      t.decimal :current_stock, precision: 12, scale: 3, default: 0
      t.decimal :min_level, precision: 12, scale: 3, default: 0
      t.integer :status, default: 0

      t.timestamps
    end
  end
end
