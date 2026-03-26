class CreatePaymentAllocations < ActiveRecord::Migration[8.0]
  def change
    create_table :payment_allocations do |t|
      t.references :payment, null: false, foreign_key: true
      t.string :allocatable_type, null: false
      t.bigint :allocatable_id, null: false
      t.decimal :amount, precision: 15, scale: 2, null: false

      t.timestamps
    end

    add_index :payment_allocations, [:allocatable_type, :allocatable_id], name: 'index_payment_allocations_on_allocatable'
    add_index :payment_allocations, [:payment_id, :allocatable_type, :allocatable_id], unique: true, name: 'index_payment_allocations_uniqueness'
  end
end
