class CreateOutboundEntries < ActiveRecord::Migration[8.0]
  def change
    create_table :outbound_entries do |t|
      t.date :date, null: false
      t.references :party, null: false, foreign_key: true
      t.string :city
      t.references :product, null: false, foreign_key: true
      t.string :category
      t.decimal :qty, precision: 12, scale: 3, null: false
      t.references :unit, null: false, foreign_key: true
      t.decimal :rate, precision: 12, scale: 2, null: false
      t.decimal :amount, precision: 15, scale: 2, null: false, default: 0
      t.decimal :transport, precision: 12, scale: 2, default: 0
      t.decimal :total_bill, precision: 15, scale: 2, null: false, default: 0
      t.decimal :received, precision: 15, scale: 2, default: 0
      t.decimal :balance, precision: 15, scale: 2, default: 0

      t.timestamps
    end

    add_index :outbound_entries, :date
  end
end
