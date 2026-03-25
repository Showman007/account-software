class UnitSerializer < Blueprinter::Base
  identifier :id

  fields :name, :abbreviation, :created_at, :updated_at
end
