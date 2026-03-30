class CreditNoteItemSerializer < Blueprinter::Base
  identifier :id

  fields :order_credit_note_id, :delivery_item_id, :product_id,
         :qty, :unit_id, :rate, :amount,
         :created_at, :updated_at

  association :product, blueprint: ProductSerializer
  association :unit, blueprint: UnitSerializer
end
