class DeliverySerializer < Blueprinter::Base
  identifier :id

  fields :order_id, :delivery_number, :date, :status,
         :transport, :vehicle_no, :driver_name, :remarks,
         :created_at, :updated_at

  association :delivery_items, blueprint: DeliveryItemSerializer
end
