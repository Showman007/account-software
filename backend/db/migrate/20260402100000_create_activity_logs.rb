class CreateActivityLogs < ActiveRecord::Migration[8.0]
  def change
    create_table :activity_logs do |t|
      t.references :user, null: false, foreign_key: true
      t.string :action, null: false          # e.g. create, update, destroy, sign_in, sign_out, export, reverse
      t.string :resource_type                 # e.g. OutboundEntry, Payment, Order
      t.bigint :resource_id                   # ID of the affected record
      t.string :resource_label                # Human-readable label (e.g. "Party: Ravi Kumar", "Order #ORD-0012")
      t.string :controller_name               # e.g. Api::V1::OutboundEntriesController
      t.string :ip_address
      t.string :user_agent
      t.jsonb :metadata, default: {}          # Extra context: changed fields, params, etc.
      t.datetime :created_at, null: false
    end

    add_index :activity_logs, :action
    add_index :activity_logs, [:resource_type, :resource_id]
    add_index :activity_logs, :created_at
    add_index :activity_logs, [:user_id, :created_at]
  end
end
