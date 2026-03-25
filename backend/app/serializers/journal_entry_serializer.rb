class JournalEntrySerializer < Blueprinter::Base
  identifier :id

  fields :entry_number, :date, :narration, :entry_type,
         :source_type, :source_id, :total_amount, :reversed_entry_id, :created_at

  association :journal_lines, blueprint: JournalLineSerializer
end
