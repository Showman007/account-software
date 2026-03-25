class AddReversalSupportToJournalEntries < ActiveRecord::Migration[7.1]
  def change
    # Remove unique index on source — multiple journal entries per source
    # (original + reversal + new entry on edit)
    remove_index :journal_entries, [:source_type, :source_id]
    add_index :journal_entries, [:source_type, :source_id]

    # Track which entry this reverses (for audit trail)
    add_reference :journal_entries, :reversed_entry, foreign_key: { to_table: :journal_entries }, null: true
  end
end
