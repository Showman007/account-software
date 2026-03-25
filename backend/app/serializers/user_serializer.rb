class UserSerializer < Blueprinter::Base
  identifier :id

  fields :email, :role, :created_at, :updated_at
end
