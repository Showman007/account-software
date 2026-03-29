module Api
  module V1
    class AuthController < BaseController
      skip_before_action :authenticate_user!, only: [:sign_in, :google]

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

      def google
        credential = params[:credential]
        unless credential.present?
          return render json: { error: "Google credential is required" }, status: :bad_request
        end

        payload = verify_google_token(credential)
        unless payload
          return render json: { error: "Invalid Google token" }, status: :unauthorized
        end

        user = User.from_google(payload)
        token = Warden::JWTAuth::UserEncoder.new.call(user, :user, nil).first

        render json: {
          token: token,
          user: UserSerializer.render_as_hash(user)
        }, status: :ok
      rescue ActiveRecord::RecordNotFound => e
        render json: { error: e.message }, status: :unauthorized
      rescue StandardError => e
        render json: { error: "Google sign-in failed: #{e.message}" }, status: :unprocessable_entity
      end

      def sign_out
        current_user.update!(jti: SecureRandom.uuid)
        render json: { message: "Signed out successfully" }, status: :ok
      end

      def me
        render json: { user: UserSerializer.render_as_hash(current_user) }, status: :ok
      end

      private

      def verify_google_token(credential)
        require "google-id-token"

        validator = GoogleIDToken::Validator.new
        # Use the Web OAuth Client ID (same as frontend VITE_GOOGLE_CLIENT_ID)
        client_id = ENV["GOOGLE_SSO_CLIENT_ID"] || ENV["GOOGLE_CLIENT_ID"]
        payload = validator.check(credential, client_id)
        payload
      rescue GoogleIDToken::ValidationError => e
        Rails.logger.error "Google token validation failed: #{e.message}"
        nil
      end
    end
  end
end
