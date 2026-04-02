class ActivityLogSerializer < Blueprinter::Base
  identifier :id

  fields :action, :resource_type, :resource_id, :resource_label,
         :controller_name, :ip_address, :metadata, :created_at

  field :user_email do |log|
    log.user&.email
  end

  field :user_role do |log|
    log.user&.role
  end
end
