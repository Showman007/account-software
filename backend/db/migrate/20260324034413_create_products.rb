class CreateProducts < ActiveRecord::Migration[8.0]
  def change
    create_table :products do |t|
      t.string :name, null: false
      t.integer :category, null: false, default: 0
      t.integer :direction, null: false, default: 0
      t.references :default_unit, foreign_key: { to_table: :units }, null: true

      t.timestamps
    end

    add_index :products, :name, unique: true
  end
end
