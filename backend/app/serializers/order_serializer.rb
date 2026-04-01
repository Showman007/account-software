class OrderSerializer < Blueprinter::Base
  identifier :id

  fields :order_number, :date, :party_id, :city, :status,
         :subtotal, :discount, :total_amount, :received, :balance,
         :valid_until, :rejection_reason, :remarks,
         :created_at, :updated_at

  association :party, blueprint: PartySerializer
  association :order_items, blueprint: OrderItemSerializer
  association :order_events, blueprint: OrderEventSerializer
  association :deliveries, blueprint: DeliverySerializer
  association :order_credit_notes, blueprint: OrderCreditNoteSerializer
end
