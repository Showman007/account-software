class CreateOrders < ActiveRecord::Migration[8.0]
  def change
    create_table :orders do |t|
      t.string :order_number, null: false
      t.date :date, null: false
      t.references :party, null: false, foreign_key: true
      t.string :city
      t.integer :status, default: 0, null: false
      t.decimal :subtotal, precision: 15, scale: 2, default: "0.0"
      t.decimal :discount, precision: 15, scale: 2, default: "0.0"
      t.decimal :total_amount, precision: 15, scale: 2, default: "0.0"
      t.decimal :received, precision: 15, scale: 2, default: "0.0"
      t.decimal :balance, precision: 15, scale: 2, default: "0.0"
      t.date :valid_until
      t.string :rejection_reason
      t.text :remarks

      t.timestamps
    end

    add_index :orders, :order_number, unique: true
    add_index :orders, :date
    add_index :orders, :status
  end
end
