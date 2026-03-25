class CreateInboundEntries < ActiveRecord::Migration[8.0]
  def change
    create_table :inbound_entries do |t|
      t.date :date, null: false
      t.references :party, null: false, foreign_key: true
      t.string :village
      t.references :product, null: false, foreign_key: true
      t.string :category
      t.decimal :qty, precision: 12, scale: 3, null: false
      t.references :unit, null: false, foreign_key: true
      t.decimal :rate, precision: 12, scale: 2, null: false
      t.decimal :gross_amt, precision: 15, scale: 2, null: false, default: 0
      t.decimal :moisture_pct, precision: 5, scale: 2, default: 0
      t.decimal :deduction_amt, precision: 15, scale: 2, default: 0
      t.decimal :net_qty, precision: 12, scale: 3, default: 0
      t.decimal :net_amt, precision: 15, scale: 2, null: false, default: 0
      t.decimal :paid, precision: 15, scale: 2, default: 0
      t.decimal :balance, precision: 15, scale: 2, default: 0

      t.timestamps
    end

    add_index :inbound_entries, :date
  end
end
