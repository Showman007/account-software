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

ActiveRecord::Schema[8.0].define(version: 2026_03_25_100000) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

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
    t.index ["date"], name: "index_outbound_entries_on_date"
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
    t.string "encrypted_password", default: "", null: false
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.string "jti", null: false
    t.integer "role", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["jti"], name: "index_users_on_jti", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
  end

  add_foreign_key "credit_transactions", "partners"
  add_foreign_key "credit_transactions", "payment_modes"
  add_foreign_key "expenses", "expense_categories", column: "category_id"
  add_foreign_key "expenses", "payment_modes"
  add_foreign_key "inbound_entries", "parties"
  add_foreign_key "inbound_entries", "products"
  add_foreign_key "inbound_entries", "units"
  add_foreign_key "journal_entries", "journal_entries", column: "reversed_entry_id"
  add_foreign_key "journal_lines", "journal_entries"
  add_foreign_key "journal_lines", "parties"
  add_foreign_key "journal_lines", "partners"
  add_foreign_key "outbound_entries", "parties"
  add_foreign_key "outbound_entries", "products"
  add_foreign_key "outbound_entries", "units"
  add_foreign_key "payments", "parties"
  add_foreign_key "payments", "payment_modes"
  add_foreign_key "payments", "payments", column: "reversed_payment_id"
  add_foreign_key "products", "units", column: "default_unit_id"
  add_foreign_key "stock_items", "products"
  add_foreign_key "stock_items", "units"
end
