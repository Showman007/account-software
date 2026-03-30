class CreateOrderEvents < ActiveRecord::Migration[8.0]
  def change
    create_table :order_events do |t|
      t.references :order, null: false, foreign_key: true
      t.integer :event_type, null: false
      t.date :date, null: false
      t.string :status_from
      t.string :status_to
      t.text :remarks
      t.references :created_by, foreign_key: { to_table: :users }

      t.timestamps
    end

    add_index :order_events, :date
  end
end
