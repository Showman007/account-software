module Api
  module V1
    class PaymentsController < BaseController
      def index
        scope = policy_scope(Payment).includes(:party, :payment_mode, :payment_allocations)
        scope = scope.joins(:party).where('parties.name ILIKE ?', "%#{params[:q]}%") if params[:q].present?
        scope = scope.where(party_id: params[:party_id]) if params[:party_id].present?
        scope = scope.where(direction: params[:direction]) if params[:direction].present?
        scope = apply_filters(scope)
        scope = apply_numeric_filters(scope, %w[amount])
        scope = apply_sorting(scope)

        records, meta = paginate(scope)
        render json: {
          data: PaymentWithAllocationsSerializer.render_as_hash(records),
          meta: meta
        }
      end

      def show
        payment = Payment.find(params[:id])
        authorize payment
        render json: { data: PaymentSerializer.render_as_hash(payment) }
      end

      def create
        payment = Payment.new(payment_params)
        authorize payment
        payment.save!
        render json: { data: PaymentSerializer.render_as_hash(payment) }, status: :created
      end

      # POST /api/v1/payments/:id/reverse
      def reverse
        payment = Payment.find(params[:id])
        authorize payment, :reverse?

        if payment.reversed?
          render json: { error: 'Payment has already been reversed' }, status: :unprocessable_entity
          return
        end

        reversal = payment.reverse!
        track_activity(action: 'reverse', record: payment, metadata: { reversal_id: reversal.id })
        render json: {
          data: PaymentSerializer.render_as_hash(reversal),
          message: "Payment ##{payment.id} reversed successfully"
        }, status: :created
      end

      private

      def payment_params
        params.permit(:date, :party_id, :village_city, :direction,
                      :amount, :payment_mode_id, :reference, :remarks)
      end
    end
  end
end
