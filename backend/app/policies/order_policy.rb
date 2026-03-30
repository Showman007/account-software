class OrderPolicy < ApplicationPolicy
  def create?
    true
  end

  def update?
    true
  end

  def confirm?
    true
  end

  def cancel?
    true
  end

  def close?
    true
  end

  def duplicate?
    true
  end

  def destroy?
    user&.admin?
  end
end
