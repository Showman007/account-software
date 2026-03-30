class OrderEventSerializer < Blueprinter::Base
  identifier :id

  fields :order_id, :event_type, :date, :status_from, :status_to,
         :remarks, :created_by_id, :created_at
end
