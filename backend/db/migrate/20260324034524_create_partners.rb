class CreatePartners < ActiveRecord::Migration[8.0]
  def change
    create_table :partners do |t|
      t.string :name, null: false
      t.string :phone
      t.date :date_joined
      t.integer :profit_share_type
      t.decimal :profit_share_rate, precision: 8, scale: 2
      t.integer :status, default: 0

      t.timestamps
    end
  end
end
