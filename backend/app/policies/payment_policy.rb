class PaymentPolicy < ApplicationPolicy
  def create?
    true
  end

  def reverse?
    user&.admin?
  end
end
