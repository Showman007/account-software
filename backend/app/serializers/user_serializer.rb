class UserSerializer < Blueprinter::Base
  identifier :id

  fields :email, :role, :provider, :avatar_url, :created_at, :updated_at
end
