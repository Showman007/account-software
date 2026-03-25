class CreateCreditTransactions < ActiveRecord::Migration[8.0]
  def change
    create_table :credit_transactions do |t|
      t.date :date, null: false
      t.references :partner, null: false, foreign_key: true
      t.integer :transaction_type, null: false
      t.decimal :credit_received, precision: 15, scale: 2, default: 0
      t.decimal :principal_returned, precision: 15, scale: 2, default: 0
      t.decimal :profit_paid, precision: 15, scale: 2, default: 0
      t.references :payment_mode, foreign_key: true
      t.decimal :running_balance, precision: 15, scale: 2, default: 0
      t.string :used_for
      t.text :remarks

      t.timestamps
    end

    add_index :credit_transactions, :date
  end
end
