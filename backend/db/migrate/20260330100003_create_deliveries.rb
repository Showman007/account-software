class CreateDeliveries < ActiveRecord::Migration[8.0]
  def change
    create_table :deliveries do |t|
      t.references :order, null: false, foreign_key: true
      t.string :delivery_number, null: false
      t.date :date, null: false
      t.integer :status, default: 0, null: false
      t.decimal :transport, precision: 12, scale: 2, default: "0.0"
      t.string :vehicle_no
      t.string :driver_name
      t.text :remarks

      t.timestamps
    end

    add_index :deliveries, :delivery_number, unique: true
    add_index :deliveries, :date
    add_index :deliveries, :status
  end
end
