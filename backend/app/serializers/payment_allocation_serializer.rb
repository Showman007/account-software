class PaymentAllocationSerializer < Blueprinter::Base
  identifier :id

  fields :payment_id, :allocatable_type, :allocatable_id, :amount,
         :created_at, :updated_at

  association :payment, blueprint: PaymentSerializer
end
