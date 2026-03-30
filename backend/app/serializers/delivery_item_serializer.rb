class DeliveryItemSerializer < Blueprinter::Base
  identifier :id

  fields :delivery_id, :order_item_id, :product_id, :qty, :unit_id,
         :created_at, :updated_at

  association :product, blueprint: ProductSerializer
  association :unit, blueprint: UnitSerializer
end
