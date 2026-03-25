class QueryRunnerPolicy < ApplicationPolicy
  def execute?
    user&.admin?
  end

  def tables?
    user&.admin?
  end
end
