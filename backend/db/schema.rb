# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.0].define(version: 2026_04_02_100000) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "activity_logs", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "action", null: false
    t.string "resource_type"
    t.bigint "resource_id"
    t.string "resource_label"
    t.string "controller_name"
    t.string "ip_address"
    t.string "user_agent"
    t.jsonb "metadata", default: {}
    t.datetime "created_at", null: false
    t.index ["action"], name: "index_activity_logs_on_action"
    t.index ["created_at"], name: "index_activity_logs_on_created_at"
    t.index ["resource_type", "resource_id"], name: "index_activity_logs_on_resource_type_and_resource_id"
    t.index ["user_id", "created_at"], name: "index_activity_logs_on_user_id_and_created_at"
    t.index ["user_id"], name: "index_activity_logs_on_user_id"
  end

  create_table "attachments", force: :cascade do |t|
    t.string "attachable_type", null: false
    t.bigint "attachable_id", null: false
    t.string "drive_file_id", null: false
    t.string "file_name", null: false
    t.string "file_type", null: false
    t.integer "file_size", null: false
    t.string "drive_url"
    t.bigint "uploaded_by_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["attachable_type", "attachable_id"], name: "index_attachments_on_attachable"
    t.index ["drive_file_id"], name: "index_attachments_on_drive_file_id", unique: true
  end

  create_table "credit_note_items", force: :cascade do |t|
    t.bigint "order_credit_note_id", null: false
    t.bigint "delivery_item_id", null: false
    t.bigint "product_id", null: false
    t.decimal "qty", precision: 12, scale: 3, null: false
    t.bigint "unit_id", null: false
    t.decimal "rate", precision: 12, scale: 2, null: false
    t.decimal "amount", precision: 15, scale: 2, default: "0.0", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["delivery_item_id"], name: "index_credit_note_items_on_delivery_item_id"
    t.index ["order_credit_note_id"], name: "index_credit_note_items_on_order_credit_note_id"
    t.index ["product_id"], name: "index_credit_note_items_on_product_id"
    t.index ["unit_id"], name: "index_credit_note_items_on_unit_id"
  end

  create_table "credit_transactions", force: :cascade do |t|
    t.date "date", null: false
    t.bigint "partner_id", null: false
    t.integer "transaction_type", null: false
    t.decimal "credit_received", precision: 15, scale: 2, default: "0.0"
    t.decimal "principal_returned", precision: 15, scale: 2, default: "0.0"
    t.decimal "profit_paid", precision: 15, scale: 2, default: "0.0"
    t.bigint "payment_mode_id"
    t.decimal "running_balance", precision: 15, scale: 2, default: "0.0"
    t.string "used_for"
    t.text "remarks"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["date"], name: "index_credit_transactions_on_date"
    t.index ["partner_id"], name: "index_credit_transactions_on_partner_id"
    t.index ["payment_mode_id"], name: "index_credit_transactions_on_payment_mode_id"
  end

  create_table "deliveries", force: :cascade do |t|
    t.bigint "order_id", null: false
    t.string "delivery_number", null: false
    t.date "date", null: false
    t.integer "status", default: 0, null: false
    t.decimal "transport", precision: 12, scale: 2, default: "0.0"
    t.string "vehicle_no"
    t.string "driver_name"
    t.text "remarks"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["date"], name: "index_deliveries_on_date"
    t.index ["delivery_number"], name: "index_deliveries_on_delivery_number", unique: true
    t.index ["order_id"], name: "index_deliveries_on_order_id"
    t.index ["status"], name: "index_deliveries_on_status"
  end

  create_table "delivery_items", force: :cascade do |t|
    t.bigint "delivery_id", null: false
    t.bigint "order_item_id", null: false
    t.bigint "product_id", null: false
    t.decimal "qty", precision: 12, scale: 3, null: false
    t.bigint "unit_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.decimal "bag_type", precision: 5, scale: 1
    t.decimal "no_of_bags", precision: 10, scale: 2
    t.index ["delivery_id"], name: "index_delivery_items_on_delivery_id"
    t.index ["order_item_id"], name: "index_delivery_items_on_order_item_id"
    t.index ["product_id"], name: "index_delivery_items_on_product_id"
    t.index ["unit_id"], name: "index_delivery_items_on_unit_id"
  end

  create_table "expense_categories", force: :cascade do |t|
    t.string "name", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_expense_categories_on_name", unique: true
  end

  create_table "expenses", force: :cascade do |t|
    t.date "date", null: false
    t.string "description", null: false
    t.bigint "category_id", null: false
    t.string "paid_to"
    t.decimal "amount", precision: 15, scale: 2, null: false
    t.bigint "payment_mode_id"
    t.text "remarks"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["category_id"], name: "index_expenses_on_category_id"
    t.index ["date"], name: "index_expenses_on_date"
    t.index ["payment_mode_id"], name: "index_expenses_on_payment_mode_id"
  end

  create_table "inbound_entries", force: :cascade do |t|
    t.date "date", null: false
    t.bigint "party_id", null: false
    t.string "village"
    t.bigint "product_id", null: false
    t.string "category"
    t.decimal "qty", precision: 12, scale: 3, null: false
    t.bigint "unit_id", null: false
    t.decimal "rate", precision: 12, scale: 2, null: false
    t.decimal "gross_amt", precision: 15, scale: 2, default: "0.0", null: false
    t.decimal "moisture_pct", precision: 5, scale: 2, default: "0.0"
    t.decimal "deduction_amt", precision: 15, scale: 2, default: "0.0"
    t.decimal "net_qty", precision: 12, scale: 3, default: "0.0"
    t.decimal "net_amt", precision: 15, scale: 2, default: "0.0", null: false
    t.decimal "paid", precision: 15, scale: 2, default: "0.0"
    t.decimal "balance", precision: 15, scale: 2, default: "0.0"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.decimal "bag_type", precision: 5, scale: 1
    t.decimal "no_of_bags", precision: 10, scale: 2
    t.index ["date"], name: "index_inbound_entries_on_date"
    t.index ["party_id"], name: "index_inbound_entries_on_party_id"
    t.index ["product_id"], name: "index_inbound_entries_on_product_id"
    t.index ["unit_id"], name: "index_inbound_entries_on_unit_id"
  end

  create_table "journal_entries", force: :cascade do |t|
    t.string "entry_number", null: false
    t.date "date", null: false
    t.text "narration", null: false
    t.integer "entry_type", default: 0, null: false
    t.string "source_type"
    t.bigint "source_id"
    t.decimal "total_amount", precision: 15, scale: 2, default: "0.0"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "reversed_entry_id"
    t.index ["date"], name: "index_journal_entries_on_date"
    t.index ["entry_number"], name: "index_journal_entries_on_entry_number", unique: true
    t.index ["entry_type"], name: "index_journal_entries_on_entry_type"
    t.index ["reversed_entry_id"], name: "index_journal_entries_on_reversed_entry_id"
    t.index ["source_type", "source_id"], name: "index_journal_entries_on_source_type_and_source_id"
  end

  create_table "journal_lines", force: :cascade do |t|
    t.bigint "journal_entry_id", null: false
    t.string "account_name", null: false
    t.integer "account_type", default: 0, null: false
    t.decimal "debit", precision: 15, scale: 2, default: "0.0"
    t.decimal "credit", precision: 15, scale: 2, default: "0.0"
    t.bigint "party_id"
    t.bigint "partner_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["account_type"], name: "index_journal_lines_on_account_type"
    t.index ["journal_entry_id"], name: "index_journal_lines_on_journal_entry_id"
    t.index ["partner_id"], name: "index_journal_lines_on_partner_id"
    t.index ["party_id"], name: "index_journal_lines_on_party_id"
  end

  create_table "milling_batches", force: :cascade do |t|
    t.date "date", null: false
    t.string "paddy_type"
    t.string "miller_name"
    t.decimal "input_qty", precision: 12, scale: 3, null: false
    t.decimal "milling_cost", precision: 12, scale: 2, default: "0.0"
    t.decimal "rice_main_qty", precision: 12, scale: 3, default: "0.0"
    t.decimal "broken_rice_qty", precision: 12, scale: 3, default: "0.0"
    t.decimal "rice_bran_qty", precision: 12, scale: 3, default: "0.0"
    t.decimal "husk_qty", precision: 12, scale: 3, default: "0.0"
    t.decimal "rice_flour_qty", precision: 12, scale: 3, default: "0.0"
    t.decimal "total_output", precision: 12, scale: 3, default: "0.0"
    t.decimal "loss_diff", precision: 12, scale: 3, default: "0.0"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["date"], name: "index_milling_batches_on_date"
  end

  create_table "order_credit_notes", force: :cascade do |t|
    t.bigint "order_id", null: false
    t.bigint "delivery_id", null: false
    t.string "credit_note_number", null: false
    t.date "date", null: false
    t.string "reason"
    t.decimal "total_amount", precision: 15, scale: 2, default: "0.0"
    t.text "remarks"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["credit_note_number"], name: "index_order_credit_notes_on_credit_note_number", unique: true
    t.index ["date"], name: "index_order_credit_notes_on_date"
    t.index ["delivery_id"], name: "index_order_credit_notes_on_delivery_id"
    t.index ["order_id"], name: "index_order_credit_notes_on_order_id"
  end

  create_table "order_events", force: :cascade do |t|
    t.bigint "order_id", null: false
    t.integer "event_type", null: false
    t.date "date", null: false
    t.string "status_from"
    t.string "status_to"
    t.text "remarks"
    t.bigint "created_by_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["created_by_id"], name: "index_order_events_on_created_by_id"
    t.index ["date"], name: "index_order_events_on_date"
    t.index ["order_id"], name: "index_order_events_on_order_id"
  end

  create_table "order_items", force: :cascade do |t|
    t.bigint "order_id", null: false
    t.bigint "product_id", null: false
    t.string "category"
    t.decimal "qty", precision: 12, scale: 3, null: false
    t.bigint "unit_id", null: false
    t.decimal "rate", precision: 12, scale: 2, null: false
    t.decimal "amount", precision: 15, scale: 2, default: "0.0", null: false
    t.decimal "delivered_qty", precision: 12, scale: 3, default: "0.0"
    t.decimal "returned_qty", precision: 12, scale: 3, default: "0.0"
    t.decimal "pending_qty", precision: 12, scale: 3, default: "0.0"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.decimal "bag_type", precision: 5, scale: 1
    t.decimal "no_of_bags", precision: 10, scale: 2
    t.index ["order_id", "product_id"], name: "index_order_items_on_order_id_and_product_id"
    t.index ["order_id"], name: "index_order_items_on_order_id"
    t.index ["product_id"], name: "index_order_items_on_product_id"
    t.index ["unit_id"], name: "index_order_items_on_unit_id"
  end

  create_table "orders", force: :cascade do |t|
    t.string "order_number", null: false
    t.date "date", null: false
    t.bigint "party_id", null: false
    t.string "city"
    t.integer "status", default: 0, null: false
    t.decimal "subtotal", precision: 15, scale: 2, default: "0.0"
    t.decimal "discount", precision: 15, scale: 2, default: "0.0"
    t.decimal "total_amount", precision: 15, scale: 2, default: "0.0"
    t.decimal "received", precision: 15, scale: 2, default: "0.0"
    t.decimal "balance", precision: 15, scale: 2, default: "0.0"
    t.date "valid_until"
    t.string "rejection_reason"
    t.text "remarks"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["date"], name: "index_orders_on_date"
    t.index ["order_number"], name: "index_orders_on_order_number", unique: true
    t.index ["party_id"], name: "index_orders_on_party_id"
    t.index ["status"], name: "index_orders_on_status"
  end

  create_table "outbound_entries", force: :cascade do |t|
    t.date "date", null: false
    t.bigint "party_id", null: false
    t.string "city"
    t.bigint "product_id", null: false
    t.string "category"
    t.decimal "qty", precision: 12, scale: 3, null: false
    t.bigint "unit_id", null: false
    t.decimal "rate", precision: 12, scale: 2, null: false
    t.decimal "amount", precision: 15, scale: 2, default: "0.0", null: false
    t.decimal "transport", precision: 12, scale: 2, default: "0.0"
    t.decimal "total_bill", precision: 15, scale: 2, default: "0.0", null: false
    t.decimal "received", precision: 15, scale: 2, default: "0.0"
    t.decimal "balance", precision: 15, scale: 2, default: "0.0"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "order_id"
    t.bigint "delivery_item_id"
    t.decimal "bag_type", precision: 5, scale: 1
    t.decimal "no_of_bags", precision: 10, scale: 2
    t.index ["date"], name: "index_outbound_entries_on_date"
    t.index ["delivery_item_id"], name: "index_outbound_entries_on_delivery_item_id"
    t.index ["order_id"], name: "index_outbound_entries_on_order_id"
    t.index ["party_id"], name: "index_outbound_entries_on_party_id"
    t.index ["product_id"], name: "index_outbound_entries_on_product_id"
    t.index ["unit_id"], name: "index_outbound_entries_on_unit_id"
  end

  create_table "parties", force: :cascade do |t|
    t.string "name", null: false
    t.string "village_city"
    t.string "phone"
    t.decimal "opening_balance", precision: 15, scale: 2, default: "0.0"
    t.integer "party_type", default: 0, null: false
    t.string "account_no"
    t.string "bank"
    t.text "notes"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_parties_on_name"
  end

  create_table "partners", force: :cascade do |t|
    t.string "name", null: false
    t.string "phone"
    t.date "date_joined"
    t.integer "profit_share_type"
    t.decimal "profit_share_rate", precision: 8, scale: 2
    t.integer "status", default: 0
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "payment_allocations", force: :cascade do |t|
    t.bigint "payment_id", null: false
    t.string "allocatable_type", null: false
    t.bigint "allocatable_id", null: false
    t.decimal "amount", precision: 15, scale: 2, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["allocatable_type", "allocatable_id"], name: "index_payment_allocations_on_allocatable"
    t.index ["payment_id", "allocatable_type", "allocatable_id"], name: "index_payment_allocations_uniqueness", unique: true
    t.index ["payment_id"], name: "index_payment_allocations_on_payment_id"
  end

  create_table "payment_modes", force: :cascade do |t|
    t.string "name", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_payment_modes_on_name", unique: true
  end

  create_table "payments", force: :cascade do |t|
    t.date "date", null: false
    t.bigint "party_id", null: false
    t.string "village_city"
    t.integer "direction", null: false
    t.decimal "amount", precision: 15, scale: 2, null: false
    t.bigint "payment_mode_id"
    t.string "reference"
    t.text "remarks"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.boolean "reversed", default: false, null: false
    t.bigint "reversed_payment_id"
    t.index ["date"], name: "index_payments_on_date"
    t.index ["party_id"], name: "index_payments_on_party_id"
    t.index ["payment_mode_id"], name: "index_payments_on_payment_mode_id"
    t.index ["reversed"], name: "index_payments_on_reversed"
    t.index ["reversed_payment_id"], name: "index_payments_on_reversed_payment_id"
  end

  create_table "products", force: :cascade do |t|
    t.string "name", null: false
    t.integer "category", default: 0, null: false
    t.integer "direction", default: 0, null: false
    t.bigint "default_unit_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["default_unit_id"], name: "index_products_on_default_unit_id"
    t.index ["name"], name: "index_products_on_name", unique: true
  end

  create_table "stock_items", force: :cascade do |t|
    t.bigint "product_id", null: false
    t.string "category"
    t.bigint "unit_id", null: false
    t.decimal "opening_stock", precision: 12, scale: 3, default: "0.0"
    t.decimal "total_inbound", precision: 12, scale: 3, default: "0.0"
    t.decimal "from_milling", precision: 12, scale: 3, default: "0.0"
    t.decimal "total_outbound", precision: 12, scale: 3, default: "0.0"
    t.decimal "current_stock", precision: 12, scale: 3, default: "0.0"
    t.decimal "min_level", precision: 12, scale: 3, default: "0.0"
    t.integer "status", default: 0
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["product_id"], name: "index_stock_items_on_product_id", unique: true
    t.index ["unit_id"], name: "index_stock_items_on_unit_id"
  end

  create_table "units", force: :cascade do |t|
    t.string "name", null: false
    t.string "abbreviation"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_units_on_name", unique: true
  end

  create_table "users", force: :cascade do |t|
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: ""
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.string "jti", null: false
    t.integer "role", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "provider"
    t.string "google_uid"
    t.string "avatar_url"
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["google_uid"], name: "index_users_on_google_uid", unique: true, where: "(google_uid IS NOT NULL)"
    t.index ["jti"], name: "index_users_on_jti", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
  end

  add_foreign_key "activity_logs", "users"
  add_foreign_key "credit_note_items", "delivery_items"
  add_foreign_key "credit_note_items", "order_credit_notes"
  add_foreign_key "credit_note_items", "products"
  add_foreign_key "credit_note_items", "units"
  add_foreign_key "credit_transactions", "partners"
  add_foreign_key "credit_transactions", "payment_modes"
  add_foreign_key "deliveries", "orders"
  add_foreign_key "delivery_items", "deliveries"
  add_foreign_key "delivery_items", "order_items"
  add_foreign_key "delivery_items", "products"
  add_foreign_key "delivery_items", "units"
  add_foreign_key "expenses", "expense_categories", column: "category_id"
  add_foreign_key "expenses", "payment_modes"
  add_foreign_key "inbound_entries", "parties"
  add_foreign_key "inbound_entries", "products"
  add_foreign_key "inbound_entries", "units"
  add_foreign_key "journal_entries", "journal_entries", column: "reversed_entry_id"
  add_foreign_key "journal_lines", "journal_entries"
  add_foreign_key "journal_lines", "parties"
  add_foreign_key "journal_lines", "partners"
  add_foreign_key "order_credit_notes", "deliveries"
  add_foreign_key "order_credit_notes", "orders"
  add_foreign_key "order_events", "orders"
  add_foreign_key "order_events", "users", column: "created_by_id"
  add_foreign_key "order_items", "orders"
  add_foreign_key "order_items", "products"
  add_foreign_key "order_items", "units"
  add_foreign_key "orders", "parties"
  add_foreign_key "outbound_entries", "delivery_items"
  add_foreign_key "outbound_entries", "orders"
  add_foreign_key "outbound_entries", "parties"
  add_foreign_key "outbound_entries", "products"
  add_foreign_key "outbound_entries", "units"
  add_foreign_key "payment_allocations", "payments"
  add_foreign_key "payments", "parties"
  add_foreign_key "payments", "payment_modes"
  add_foreign_key "payments", "payments", column: "reversed_payment_id"
  add_foreign_key "products", "units", column: "default_unit_id"
  add_foreign_key "stock_items", "products"
  add_foreign_key "stock_items", "units"
end
