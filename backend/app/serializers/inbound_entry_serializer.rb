class InboundEntrySerializer < Blueprinter::Base
  identifier :id

  fields :date, :party_id, :village, :product_id, :category,
         :bag_type, :no_of_bags, :qty, :unit_id, :rate,
         :gross_amt, :moisture_pct,
         :deduction_amt, :net_qty, :net_amt, :paid, :balance,
         :created_at, :updated_at

  association :party, blueprint: PartySerializer
  association :product, blueprint: ProductSerializer
  association :unit, blueprint: UnitSerializer
  association :attachment, blueprint: AttachmentSerializer
end
