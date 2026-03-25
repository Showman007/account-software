class CreatePayments < ActiveRecord::Migration[8.0]
  def change
    create_table :payments do |t|
      t.date :date, null: false
      t.references :party, null: false, foreign_key: true
      t.string :village_city
      t.integer :direction, null: false
      t.decimal :amount, precision: 15, scale: 2, null: false
      t.references :payment_mode, foreign_key: true
      t.string :reference
      t.text :remarks

      t.timestamps
    end

    add_index :payments, :date
  end
end
