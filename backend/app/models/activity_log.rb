class ActivityLog < ApplicationRecord
  belongs_to :user

  validates :action, presence: true

  scope :recent, -> { order(created_at: :desc) }
  scope :by_user, ->(user_id) { where(user_id: user_id) }
  scope :by_action, ->(action) { where(action: action) }
  scope :by_resource, ->(type) { where(resource_type: type) }
end
