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
    # Skip journal creation for reversal payments — they are not real transactions.
    # The original payment's update callback handles the reversal journal entry.
    return if is_a?(Payment) && is_reversal?

    JournalService.create_for(self)
  rescue StandardError => e
    Rails.logger.error("Failed to create journal entry for #{self.class}##{id}: #{e.message}")
  end

  def update_journal_entry
    # When a payment is marked as reversed, only reverse the journal — don't recreate.
    if is_a?(Payment) && reversed? && saved_change_to_reversed?
      JournalService.reverse_for(self)
    else
      JournalService.reverse_and_recreate_for(self)
    end
  rescue StandardError => e
    Rails.logger.error("Failed to update journal entry for #{self.class}##{id}: #{e.message}")
  end

  def reverse_journal_entry_on_destroy
    JournalService.reverse_for(self)
  rescue StandardError => e
    Rails.logger.error("Failed to reverse journal entry for #{self.class}##{id}: #{e.message}")
  end
end
