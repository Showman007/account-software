class OutboundEntrySerializer < Blueprinter::Base
  identifier :id

  fields :date, :party_id, :city, :product_id, :category,
         :bag_type, :no_of_bags, :qty, :unit_id, :rate,
         :amount, :transport,
         :total_bill, :received, :balance,
         :order_id, :delivery_item_id,
         :created_at, :updated_at

  # Order info for linked entries
  field :order_number do |entry|
    entry.order&.order_number
  end

  field :delivery_number do |entry|
    entry.delivery_item&.delivery&.delivery_number
  end

  association :party, blueprint: PartySerializer
  association :product, blueprint: ProductSerializer
  association :unit, blueprint: UnitSerializer
  association :attachment, blueprint: AttachmentSerializer
  association :payment_allocations, blueprint: PaymentAllocationSerializer
end
