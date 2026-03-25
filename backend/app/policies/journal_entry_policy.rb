class JournalEntryPolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    true
  end

  def backfill?
    user&.admin?
  end
end
