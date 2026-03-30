class DeliveryPolicy < ApplicationPolicy
  def create?
    true
  end

  def update?
    true
  end

  def mark_in_transit?
    true
  end

  def mark_delivered?
    true
  end

  def destroy?
    user&.admin?
  end
end
