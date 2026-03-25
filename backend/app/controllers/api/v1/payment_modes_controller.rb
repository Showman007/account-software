module Api
  module V1
    class PaymentModesController < BaseController
      def index
        scope = policy_scope(PaymentMode)
        scope = scope.where('name ILIKE ?', "%#{params[:q]}%") if params[:q].present?
        scope = apply_sorting(scope)

        records, meta = paginate(scope)
        render json: {
          data: PaymentModeSerializer.render_as_hash(records),
          meta: meta
        }
      end

      def show
        mode = PaymentMode.find(params[:id])
        authorize mode
        render json: { data: PaymentModeSerializer.render_as_hash(mode) }
      end

      def create
        mode = PaymentMode.new(payment_mode_params)
        authorize mode
        mode.save!
        render json: { data: PaymentModeSerializer.render_as_hash(mode) }, status: :created
      end

      def update
        mode = PaymentMode.find(params[:id])
        authorize mode
        mode.update!(payment_mode_params)
        render json: { data: PaymentModeSerializer.render_as_hash(mode) }
      end

      def destroy
        mode = PaymentMode.find(params[:id])
        authorize mode
        mode.destroy!
        head :no_content
      end

      private

      def payment_mode_params
        params.permit(:name)
      end
    end
  end
end
