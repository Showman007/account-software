namespace :journals do
  desc "Backfill journal entries for all existing records"
  task backfill: :environment do
    puts "Starting journal backfill..."
    count = JournalService.backfill_all!
    puts "Done! Created #{count} journal entries."
  end

  desc "Clear all journal entries (use with caution)"
  task clear: :environment do
    count = JournalEntry.count
    JournalEntry.destroy_all
    puts "Cleared #{count} journal entries."
  end

  desc "Fix duplicate journal entries caused by payment reversals"
  task fix_reversals: :environment do
    puts "Fixing reversal journal entries..."

    # Step 1: Remove journal entries created BY reversal payments (they shouldn't have any)
    reversal_payment_ids = Payment.where.not(reversed_payment_id: nil).pluck(:id)
    bad_entries = JournalEntry.where(source_type: 'Payment', source_id: reversal_payment_ids)
    count1 = bad_entries.count
    bad_entries.destroy_all
    puts "  Removed #{count1} journal entries from reversal payment records"

    # Step 2: Fix original reversed payments that have duplicate non-reversal entries
    reversed_originals = Payment.where(reversed: true, reversed_payment_id: nil)
    count2 = 0
    reversed_originals.find_each do |p|
      non_reversal_entries = JournalEntry.where(source: p).where.not(entry_type: :reversal).order(created_at: :asc)
      if non_reversal_entries.count > 1
        # Keep the oldest (original), remove the rest (duplicates from bug)
        non_reversal_entries.offset(1).destroy_all
        count2 += non_reversal_entries.count - 1
      end
    end
    puts "  Removed #{count2} duplicate recreated journal entries"

    # Step 3: Ensure every reversed payment has exactly 1 reversal journal entry
    count3 = 0
    reversed_originals.find_each do |p|
      reversal_entries = JournalEntry.where(source: p, entry_type: :reversal)
      if reversal_entries.empty?
        # Missing reversal entry — create one
        JournalService.reverse_for(p)
        count3 += 1
        puts "  Created missing reversal journal entry for Payment ##{p.id}"
      elsif reversal_entries.count > 1
        # Duplicate reversal entries — keep the oldest, remove the rest
        reversal_entries.order(created_at: :asc).offset(1).destroy_all
        count3 += reversal_entries.count - 1
      end
    end
    puts "  Fixed #{count3} missing/duplicate reversal entries"

    puts "Done! Journal entries cleaned up."
  end

  desc "Full rebuild — clear all journal entries and recreate from scratch"
  task rebuild: :environment do
    puts "WARNING: This will destroy ALL journal entries and recreate them."
    puts "Clearing..."
    JournalEntry.destroy_all

    puts "Rebuilding from all records..."
    count = JournalService.backfill_all!

    puts "Creating reversal entries for reversed payments..."
    rev_count = 0
    Payment.where(reversed: true, reversed_payment_id: nil).find_each do |p|
      JournalService.reverse_for(p)
      rev_count += 1
    end

    puts "Done! Created #{count} journal entries + #{rev_count} reversal entries."
  end
end

namespace :payments do
  desc "Backfill auto-payments from existing inbound/outbound entries"
  task backfill: :environment do
    count = 0

    InboundEntry.where('paid > 0').find_each do |entry|
      ref = "auto:InboundEntry:#{entry.id}"
      next if Payment.exists?(reference: ref)

      Payment.create!(
        date: entry.date,
        party_id: entry.party_id,
        direction: :payment_to_supplier,
        amount: entry.paid,
        reference: ref,
        remarks: "Auto: Inbound entry ##{entry.id}"
      )
      count += 1
    end

    OutboundEntry.where('received > 0').find_each do |entry|
      ref = "auto:OutboundEntry:#{entry.id}"
      next if Payment.exists?(reference: ref)

      Payment.create!(
        date: entry.date,
        party_id: entry.party_id,
        direction: :receipt_from_buyer,
        amount: entry.received,
        reference: ref,
        remarks: "Auto: Outbound entry ##{entry.id}"
      )
      count += 1
    end

    puts "Done! Created #{count} auto-payments."
  end
end
