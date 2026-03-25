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
