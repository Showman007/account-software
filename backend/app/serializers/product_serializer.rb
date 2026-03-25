class ProductSerializer < Blueprinter::Base
  identifier :id

  fields :name, :category, :direction, :default_unit_id, :created_at, :updated_at

  association :default_unit, blueprint: UnitSerializer
end
