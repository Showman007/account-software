class CreateOrderCreditNotes < ActiveRecord::Migration[8.0]
  def change
    create_table :order_credit_notes do |t|
      t.references :order, null: false, foreign_key: true
      t.references :delivery, null: false, foreign_key: true
      t.string :credit_note_number, null: false
      t.date :date, null: false
      t.string :reason
      t.decimal :total_amount, precision: 15, scale: 2, default: "0.0"
      t.text :remarks

      t.timestamps
    end

    add_index :order_credit_notes, :credit_note_number, unique: true
    add_index :order_credit_notes, :date
  end
end
