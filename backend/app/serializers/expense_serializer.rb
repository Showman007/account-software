class ExpenseSerializer < Blueprinter::Base
  identifier :id

  fields :date, :description, :category_id, :paid_to, :amount,
         :payment_mode_id, :remarks, :created_at, :updated_at

  association :category, blueprint: ExpenseCategorySerializer
  association :payment_mode, blueprint: PaymentModeSerializer
end
