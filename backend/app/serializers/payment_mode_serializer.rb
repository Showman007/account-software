class PaymentModeSerializer < Blueprinter::Base
  identifier :id

  fields :name, :created_at, :updated_at
end
