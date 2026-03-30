class CreateCreditNoteItems < ActiveRecord::Migration[8.0]
  def change
    create_table :credit_note_items do |t|
      t.references :order_credit_note, null: false, foreign_key: true
      t.references :delivery_item, null: false, foreign_key: true
      t.references :product, null: false, foreign_key: true
      t.decimal :qty, precision: 12, scale: 3, null: false
      t.references :unit, null: false, foreign_key: true
      t.decimal :rate, precision: 12, scale: 2, null: false
      t.decimal :amount, precision: 15, scale: 2, default: "0.0", null: false

      t.timestamps
    end
  end
end
