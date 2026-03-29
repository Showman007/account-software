class User < ApplicationRecord
  include Devise::JWT::RevocationStrategies::JTIMatcher

  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable,
         :jwt_authenticatable, jwt_revocation_strategy: self

  enum :role, { user: 0, admin: 1 }

  def jwt_payload
    super.merge('role' => role)
  end

  def generate_jti
    SecureRandom.uuid
  end

  before_create :set_jti

  # SSO users don't need a password
  def password_required?
    provider.blank? && super
  end

  # Find existing user from Google SSO (no auto-creation)
  def self.from_google(payload)
    user = find_by(google_uid: payload["sub"]) || find_by(email: payload["email"])

    unless user
      raise ActiveRecord::RecordNotFound, "No account found for #{payload['email']}. Please contact your admin."
    end

    # Link existing user to Google if not already linked
    unless user.google_uid
      user.update!(
        provider: "google",
        google_uid: payload["sub"],
        avatar_url: payload["picture"]
      )
    end

    user
  end

  private

  def set_jti
    self.jti ||= generate_jti
  end
end
