class CreateParties < ActiveRecord::Migration[8.0]
  def change
    create_table :parties do |t|
      t.string :name, null: false
      t.string :village_city
      t.string :phone
      t.decimal :opening_balance, precision: 15, scale: 2, default: 0
      t.integer :party_type, null: false, default: 0
      t.string :account_no
      t.string :bank
      t.text :notes

      t.timestamps
    end

    add_index :parties, :name
  end
end
