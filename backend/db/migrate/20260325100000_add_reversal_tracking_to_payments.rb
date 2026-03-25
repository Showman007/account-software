class AddReversalTrackingToPayments < ActiveRecord::Migration[7.1]
  def change
    # Track whether a payment has been reversed
    add_column :payments, :reversed, :boolean, default: false, null: false
    # Link reversal payment to the original it reverses
    add_reference :payments, :reversed_payment, foreign_key: { to_table: :payments }, null: true

    add_index :payments, :reversed
  end
end
