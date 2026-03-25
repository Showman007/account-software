class StockItemPolicy < ApplicationPolicy
  def recalculate?
    user&.admin?
  end
end
