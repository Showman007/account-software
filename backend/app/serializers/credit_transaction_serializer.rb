class CreditTransactionSerializer < Blueprinter::Base
  identifier :id

  fields :date, :partner_id, :transaction_type, :credit_received,
         :principal_returned, :profit_paid, :payment_mode_id,
         :running_balance, :used_for, :remarks, :created_at, :updated_at

  association :partner, blueprint: PartnerSerializer
  association :payment_mode, blueprint: PaymentModeSerializer
end
