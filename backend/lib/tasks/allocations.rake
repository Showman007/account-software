namespace :allocations do
  desc "Backfill payment allocations for all parties (FIFO)"
  task backfill: :environment do
    puts "Backfilling payment allocations..."
    count = PaymentAllocationService.backfill_all
    total_allocations = PaymentAllocation.count
    puts "Done! Processed #{count} parties, created #{total_allocations} allocations."
  end

  desc "Re-allocate payments for a specific party"
  task :reallocate_party, [:party_id] => :environment do |_t, args|
    party = Party.find(args[:party_id])
    puts "Re-allocating payments for #{party.name} (ID: #{party.id})..."
    PaymentAllocationService.reallocate_party(party)
    alloc_count = PaymentAllocation.joins(:payment).where(payments: { party_id: party.id }).count
    puts "Done! #{alloc_count} allocations for #{party.name}."
  end

  desc "Clear all payment allocations and recalculate bill balances"
  task reset: :environment do
    puts "Clearing all allocations..."
    PaymentAllocation.delete_all

    puts "Resetting bill balances..."
    OutboundEntry.find_each do |e|
      e.update_column(:balance, e.total_bill)
      e.update_column(:received, 0)
    end
    InboundEntry.find_each do |e|
      e.update_column(:balance, e.net_amt)
      e.update_column(:paid, 0)
    end

    puts "Done! All allocations cleared. Run allocations:backfill to re-create them."
  end
end
