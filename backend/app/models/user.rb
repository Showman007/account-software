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

  private

  def set_jti
    self.jti ||= generate_jti
  end
end
