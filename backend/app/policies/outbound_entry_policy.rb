class OutboundEntryPolicy < ApplicationPolicy
  def create?
    true
  end

  def update?
    true
  end

  def destroy?
    user&.admin?
  end
end
