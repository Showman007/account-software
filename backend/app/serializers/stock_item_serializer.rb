class StockItemSerializer < Blueprinter::Base
  identifier :id

  fields :product_id, :category, :unit_id, :opening_stock,
         :total_inbound, :from_milling, :total_outbound,
         :current_stock, :min_level, :status, :created_at, :updated_at

  association :product, blueprint: ProductSerializer
  association :unit, blueprint: UnitSerializer
end
