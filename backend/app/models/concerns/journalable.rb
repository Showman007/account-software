module Journalable
  extend ActiveSupport::Concern

  included do
    # Multiple journal entries per source: original + reversal(s) + new entries
    has_many :journal_entries, as: :source

    after_create_commit :create_journal_entry
    after_update_commit :update_journal_entry
    before_destroy :reverse_journal_entry_on_destroy
  end

  private

  def create_journal_entry
    JournalService.create_for(self)
  rescue StandardError => e
    Rails.logger.error("Failed to create journal entry for #{self.class}##{id}: #{e.message}")
  end

  def update_journal_entry
    JournalService.reverse_and_recreate_for(self)
  rescue StandardError => e
    Rails.logger.error("Failed to update journal entry for #{self.class}##{id}: #{e.message}")
  end

  def reverse_journal_entry_on_destroy
    JournalService.reverse_for(self)
  rescue StandardError => e
    Rails.logger.error("Failed to reverse journal entry for #{self.class}##{id}: #{e.message}")
  end
end
