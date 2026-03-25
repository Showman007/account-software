class CreatePaymentModes < ActiveRecord::Migration[8.0]
  def change
    create_table :payment_modes do |t|
      t.string :name, null: false

      t.timestamps
    end

    add_index :payment_modes, :name, unique: true
  end
end
