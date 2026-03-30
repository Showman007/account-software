class OrderItemSerializer < Blueprinter::Base
  identifier :id

  fields :order_id, :product_id, :category, :qty, :unit_id, :rate,
         :amount, :delivered_qty, :returned_qty, :pending_qty,
         :created_at, :updated_at

  association :product, blueprint: ProductSerializer
  association :unit, blueprint: UnitSerializer
end
