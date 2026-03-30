class OrderCreditNoteSerializer < Blueprinter::Base
  identifier :id

  fields :order_id, :delivery_id, :credit_note_number, :date,
         :reason, :total_amount, :remarks,
         :created_at, :updated_at

  association :credit_note_items, blueprint: CreditNoteItemSerializer
end
