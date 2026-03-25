class ApplicationController < ActionController::API
  include Pundit::Authorization

  before_action :authenticate_user!

  rescue_from Pundit::NotAuthorizedError, with: :user_not_authorized
  rescue_from ActiveRecord::RecordNotFound, with: :record_not_found
  rescue_from ActiveRecord::RecordInvalid, with: :record_invalid

  private

  def user_not_authorized(_exception)
    render json: { error: "You are not authorized to perform this action" }, status: :forbidden
  end

  def record_not_found(exception)
    render json: { error: "#{exception.model || 'Record'} not found" }, status: :not_found
  end

  def record_invalid(exception)
    render json: { errors: exception.record.errors.full_messages }, status: :unprocessable_entity
  end

  def paginate(scope)
    page = (params[:page] || 1).to_i
    per_page = (params[:per_page] || 25).to_i.clamp(1, 100)
    total = scope.count
    records = scope.offset((page - 1) * per_page).limit(per_page)
    meta = {
      current_page: page,
      total_pages: [(total.to_f / per_page).ceil, 1].max,
      total_count: total,
      per_page: per_page
    }
    [records, meta]
  end
end
