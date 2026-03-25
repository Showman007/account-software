module Api
  module V1
    class ExpenseCategoriesController < BaseController
      def index
        scope = policy_scope(ExpenseCategory)
        scope = scope.where('name ILIKE ?', "%#{params[:q]}%") if params[:q].present?
        scope = apply_sorting(scope)

        records, meta = paginate(scope)
        render json: {
          data: ExpenseCategorySerializer.render_as_hash(records),
          meta: meta
        }
      end

      def show
        category = ExpenseCategory.find(params[:id])
        authorize category
        render json: { data: ExpenseCategorySerializer.render_as_hash(category) }
      end

      def create
        category = ExpenseCategory.new(expense_category_params)
        authorize category
        category.save!
        render json: { data: ExpenseCategorySerializer.render_as_hash(category) }, status: :created
      end

      def update
        category = ExpenseCategory.find(params[:id])
        authorize category
        category.update!(expense_category_params)
        render json: { data: ExpenseCategorySerializer.render_as_hash(category) }
      end

      def destroy
        category = ExpenseCategory.find(params[:id])
        authorize category
        category.destroy!
        head :no_content
      end

      private

      def expense_category_params
        params.permit(:name)
      end
    end
  end
end
