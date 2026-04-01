class DeliveryItemSerializer < Blueprinter::Base
  identifier :id

  fields :delivery_id, :order_item_id, :product_id,
         :bag_type, :no_of_bags, :qty, :unit_id,
         :created_at, :updated_at

  field :returnable_qty do |di|
    di.returnable_qty
  end

  association :product, blueprint: ProductSerializer
  association :unit, blueprint: UnitSerializer
end
