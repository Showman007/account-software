module Api
  module V1
    class UsersController < BaseController
      def index
        authorize User
        scope = policy_scope(User)
        scope = scope.where('email ILIKE ?', "%#{params[:q]}%") if params[:q].present?
        scope = scope.where(role: params[:role]) if params[:role].present?
        scope = apply_sorting(scope)

        records, meta = paginate(scope)
        render json: {
          data: UserSerializer.render_as_hash(records),
          meta: meta
        }
      end

      def show
        user = User.find(params[:id])
        authorize user
        render json: { data: UserSerializer.render_as_hash(user) }
      end

      def create
        authorize User
        user = User.new(user_params)
        user.save!
        render json: { data: UserSerializer.render_as_hash(user) }, status: :created
      end

      def update
        user = User.find(params[:id])
        authorize user
        update_data = user_params.reject { |_, v| v.blank? }
        user.update!(update_data)
        render json: { data: UserSerializer.render_as_hash(user) }
      end

      def destroy
        user = User.find(params[:id])
        authorize user
        if user == current_user
          return render json: { error: 'You cannot delete your own account' }, status: :unprocessable_entity
        end
        user.destroy!
        head :no_content
      end

      private

      def user_params
        params.permit(:email, :password, :password_confirmation, :role)
      end
    end
  end
end
