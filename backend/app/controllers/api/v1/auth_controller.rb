module Api
  module V1
    class AuthController < BaseController
      skip_before_action :authenticate_user!, only: [:sign_in]

      def sign_in
        user_params = params[:user] || params
        user = User.find_by(email: user_params[:email])
        if user&.valid_password?(user_params[:password])
          token = Warden::JWTAuth::UserEncoder.new.call(user, :user, nil).first
          render json: {
            token: token,
            user: UserSerializer.render_as_hash(user)
          }, status: :ok
        else
          render json: { error: "Invalid email or password" }, status: :unauthorized
        end
      end

      def sign_out
        current_user.update!(jti: SecureRandom.uuid)
        render json: { message: "Signed out successfully" }, status: :ok
      end

      def me
        render json: { user: UserSerializer.render_as_hash(current_user) }, status: :ok
      end
    end
  end
end
