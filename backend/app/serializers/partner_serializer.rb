class PartnerSerializer < Blueprinter::Base
  identifier :id

  fields :name, :phone, :date_joined, :profit_share_type,
         :profit_share_rate, :status, :created_at, :updated_at
end
