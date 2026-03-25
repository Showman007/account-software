class CreateJournalEntries < ActiveRecord::Migration[7.1]
  def change
    create_table :journal_entries do |t|
      t.string :entry_number, null: false
      t.date :date, null: false
      t.text :narration, null: false
      t.integer :entry_type, null: false, default: 0
      t.string :source_type
      t.bigint :source_id
      t.decimal :total_amount, precision: 15, scale: 2, default: 0

      t.timestamps
    end

    add_index :journal_entries, :entry_number, unique: true
    add_index :journal_entries, :date
    add_index :journal_entries, :entry_type
    add_index :journal_entries, [:source_type, :source_id], unique: true

    create_table :journal_lines do |t|
      t.references :journal_entry, null: false, foreign_key: true
      t.string :account_name, null: false
      t.integer :account_type, null: false, default: 0
      t.decimal :debit, precision: 15, scale: 2, default: 0
      t.decimal :credit, precision: 15, scale: 2, default: 0
      t.references :party, foreign_key: true
      t.references :partner, foreign_key: true

      t.timestamps
    end

    add_index :journal_lines, :account_type
  end
end
