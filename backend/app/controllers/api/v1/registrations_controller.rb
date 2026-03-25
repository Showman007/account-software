module Api
  module V1
    class RegistrationsController < BaseController
      skip_before_action :authenticate_user!, only: [:create]

      def create
        user = User.new(registration_params)
        if user.save
          token = Warden::JWTAuth::UserEncoder.new.call(user, :user, nil).first
          render json: {
            token: token,
            user: UserSerializer.render_as_hash(user)
          }, status: :created
        else
          render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
        end
      end

      private

      def registration_params
        p = params[:user] || params
        p.permit(:email, :password, :password_confirmation)
      end
    end
  end
end
