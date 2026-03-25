class PaymentSerializer < Blueprinter::Base
  identifier :id

  fields :date, :party_id, :village_city, :direction, :amount,
         :payment_mode_id, :reference, :remarks, :reversed,
         :reversed_payment_id, :created_at, :updated_at

  association :party, blueprint: PartySerializer
  association :payment_mode, blueprint: PaymentModeSerializer
end
