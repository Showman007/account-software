module Api
  module V1
    class ExpensesController < BaseController
      def index
        scope = policy_scope(Expense).includes(:category, :payment_mode)
        scope = scope.where('description ILIKE ?', "%#{params[:q]}%") if params[:q].present?
        scope = scope.where(category_id: params[:category_id]) if params[:category_id].present?
        scope = apply_filters(scope)
        scope = apply_sorting(scope)

        records, meta = paginate(scope)
        render json: {
          data: ExpenseSerializer.render_as_hash(records),
          meta: meta
        }
      end

      def show
        expense = Expense.find(params[:id])
        authorize expense
        render json: { data: ExpenseSerializer.render_as_hash(expense) }
      end

      def create
        expense = Expense.new(expense_params)
        authorize expense
        expense.save!
        render json: { data: ExpenseSerializer.render_as_hash(expense) }, status: :created
      end

      def update
        expense = Expense.find(params[:id])
        authorize expense
        expense.update!(expense_params)
        render json: { data: ExpenseSerializer.render_as_hash(expense) }
      end

      def destroy
        expense = Expense.find(params[:id])
        authorize expense
        expense.destroy!
        head :no_content
      end

      private

      def expense_params
        params.permit(:date, :description, :category_id, :paid_to,
                      :amount, :payment_mode_id, :remarks)
      end
    end
  end
end
