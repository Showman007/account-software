class OutboundEntrySerializer < Blueprinter::Base
  identifier :id

  fields :date, :party_id, :city, :product_id, :category,
         :bag_type, :no_of_bags, :qty, :unit_id, :rate,
         :amount, :transport,
         :total_bill, :received, :balance,
         :created_at, :updated_at

  association :party, blueprint: PartySerializer
  association :product, blueprint: ProductSerializer
  association :unit, blueprint: UnitSerializer
  association :attachment, blueprint: AttachmentSerializer
end
