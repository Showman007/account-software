module Api
  module V1
    class CreditTransactionsController < BaseController
      def index
        scope = policy_scope(CreditTransaction).includes(:partner, :payment_mode)
        scope = scope.joins(:partner).where('partners.name ILIKE ?', "%#{params[:q]}%") if params[:q].present?
        scope = scope.where(partner_id: params[:partner_id]) if params[:partner_id].present?
        scope = scope.where(transaction_type: params[:transaction_type]) if params[:transaction_type].present?
        scope = apply_filters(scope)
        scope = apply_numeric_filters(scope, %w[credit_received principal_returned profit_paid])
        scope = apply_sorting(scope)

        records, meta = paginate(scope)
        render json: {
          data: CreditTransactionSerializer.render_as_hash(records),
          meta: meta
        }
      end

      def show
        txn = CreditTransaction.find(params[:id])
        authorize txn
        render json: { data: CreditTransactionSerializer.render_as_hash(txn) }
      end

      def create
        txn = CreditTransaction.new(credit_transaction_params)
        authorize txn
        txn.save!
        render json: { data: CreditTransactionSerializer.render_as_hash(txn) }, status: :created
      end

      def update
        txn = CreditTransaction.find(params[:id])
        authorize txn
        txn.update!(credit_transaction_params)
        render json: { data: CreditTransactionSerializer.render_as_hash(txn) }
      end

      def destroy
        txn = CreditTransaction.find(params[:id])
        authorize txn
        txn.destroy!
        head :no_content
      end

      private

      def credit_transaction_params
        params.permit(:date, :partner_id, :transaction_type, :credit_received,
                      :principal_returned, :profit_paid, :payment_mode_id,
                      :used_for, :remarks)
      end
    end
  end
end
