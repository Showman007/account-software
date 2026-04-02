# Concern to automatically log user activity on controller actions.
# Include in any controller to track create, update, destroy actions.
#
# Usage:
#   class SomeController < BaseController
#     include ActivityTrackable
#   end
#
# For custom actions (e.g. reverse, confirm), call `track_activity` manually.
#
module ActivityTrackable
  extend ActiveSupport::Concern

  included do
    after_action :log_activity, if: -> { action_name.in?(%w[create update destroy]) }
    after_action :log_view_activity, if: -> { action_name.in?(%w[index show]) }
  end

  private

  def log_activity
    return unless current_user
    return unless response.successful?

    action_name_str = action_name # "create", "update", "destroy"
    record = instance_variable_get(resource_ivar)

    ActivityLog.create!(
      user: current_user,
      action: action_name_str,
      resource_type: resource_class_name,
      resource_id: record&.id,
      resource_label: build_resource_label(record),
      controller_name: self.class.name,
      ip_address: request.remote_ip,
      user_agent: request.user_agent&.truncate(500),
      metadata: build_metadata(action_name_str, record)
    )
  rescue StandardError => e
    # Never let activity logging break the main request
    Rails.logger.warn("ActivityLog failed: #{e.message}")
  end

  def log_view_activity
    return unless current_user
    return unless response.successful?

    # Throttle view logging: only log once per user per resource per 5 minutes
    cache_key = "activity_view:#{current_user.id}:#{resource_class_name}:#{action_name}:#{params[:id]}"
    return if Rails.cache.read(cache_key)

    Rails.cache.write(cache_key, true, expires_in: 5.minutes)

    action_label = action_name == 'show' ? 'view' : 'list'

    ActivityLog.create!(
      user: current_user,
      action: action_label,
      resource_type: resource_class_name,
      resource_id: action_name == 'show' ? params[:id]&.to_i : nil,
      resource_label: nil,
      controller_name: self.class.name,
      ip_address: request.remote_ip,
      user_agent: request.user_agent&.truncate(500),
      metadata: {}
    )
  rescue StandardError => e
    Rails.logger.warn("ActivityLog view failed: #{e.message}")
  end

  # Track custom actions (reverse, confirm, cancel, etc.)
  def track_activity(action:, record: nil, metadata: {})
    return unless current_user

    ActivityLog.create!(
      user: current_user,
      action: action,
      resource_type: record&.class&.name || resource_class_name,
      resource_id: record&.id,
      resource_label: build_resource_label(record),
      controller_name: self.class.name,
      ip_address: request.remote_ip,
      user_agent: request.user_agent&.truncate(500),
      metadata: metadata
    )
  rescue StandardError => e
    Rails.logger.warn("ActivityLog failed: #{e.message}")
  end

  # Guess the instance variable name from controller (e.g. @outbound_entry)
  def resource_ivar
    "@#{controller_name.classify.demodulize.underscore.singularize}"
  end

  # Guess the model class name from controller
  def resource_class_name
    controller_name.classify.demodulize.singularize
  end

  def build_resource_label(record)
    return nil unless record

    case record
    when Party then "Party: #{record.name}"
    when OutboundEntry then "Outbound ##{record.id} — #{record.product&.name}"
    when InboundEntry then "Inbound ##{record.id} — #{record.product&.name}"
    when Payment then "Payment ##{record.id} — #{record.amount}"
    when Order then "Order #{record.order_number}"
    when Delivery then "Delivery #{record.delivery_number}"
    when Expense then "Expense ##{record.id} — #{record.description&.truncate(40)}"
    when MillingBatch then "Milling ##{record.id}"
    when Product then "Product: #{record.name}"
    when Unit then "Unit: #{record.name}"
    when User then "User: #{record.email}"
    when StockItem then "Stock: #{record.product&.name}"
    when Partner then "Partner: #{record.name}"
    when CreditTransaction then "Credit Txn ##{record.id}"
    else "#{record.class.name} ##{record.id}"
    end
  rescue StandardError
    "#{record.class.name} ##{record.id}" rescue nil
  end

  def build_metadata(action, record)
    meta = {}

    if action == 'update' && record.respond_to?(:saved_changes)
      changes = record.saved_changes.except('updated_at', 'created_at')
      meta[:changes] = changes.transform_values { |v| { from: v[0], to: v[1] } } if changes.any?
    end

    if action == 'create' && record
      meta[:created_fields] = record.attributes.except('id', 'created_at', 'updated_at')
                                    .select { |_, v| v.present? }
                                    .keys
    end

    meta
  end
end
