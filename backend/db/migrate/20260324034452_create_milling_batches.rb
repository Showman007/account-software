class CreateMillingBatches < ActiveRecord::Migration[8.0]
  def change
    create_table :milling_batches do |t|
      t.date :date, null: false
      t.string :paddy_type
      t.string :miller_name
      t.decimal :input_qty, precision: 12, scale: 3, null: false
      t.decimal :milling_cost, precision: 12, scale: 2, default: 0
      t.decimal :rice_main_qty, precision: 12, scale: 3, default: 0
      t.decimal :broken_rice_qty, precision: 12, scale: 3, default: 0
      t.decimal :rice_bran_qty, precision: 12, scale: 3, default: 0
      t.decimal :husk_qty, precision: 12, scale: 3, default: 0
      t.decimal :rice_flour_qty, precision: 12, scale: 3, default: 0
      t.decimal :total_output, precision: 12, scale: 3, default: 0
      t.decimal :loss_diff, precision: 12, scale: 3, default: 0

      t.timestamps
    end

    add_index :milling_batches, :date
  end
end
