class CreateExpenses < ActiveRecord::Migration[8.0]
  def change
    create_table :expenses do |t|
      t.date :date, null: false
      t.string :description, null: false
      t.references :category, null: false, foreign_key: { to_table: :expense_categories }
      t.string :paid_to
      t.decimal :amount, precision: 15, scale: 2, null: false
      t.references :payment_mode, foreign_key: true
      t.text :remarks

      t.timestamps
    end

    add_index :expenses, :date
  end
end
