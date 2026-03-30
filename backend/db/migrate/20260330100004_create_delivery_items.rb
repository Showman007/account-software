class CreateDeliveryItems < ActiveRecord::Migration[8.0]
  def change
    create_table :delivery_items do |t|
      t.references :delivery, null: false, foreign_key: true
      t.references :order_item, null: false, foreign_key: true
      t.references :product, null: false, foreign_key: true
      t.decimal :qty, precision: 12, scale: 3, null: false
      t.references :unit, null: false, foreign_key: true

      t.timestamps
    end
  end
end
