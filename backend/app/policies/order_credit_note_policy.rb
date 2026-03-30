class OrderCreditNotePolicy < ApplicationPolicy
  def create?
    true
  end

  def destroy?
    user&.admin?
  end
end
