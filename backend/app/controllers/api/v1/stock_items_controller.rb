module Api
  module V1
    class StockItemsController < BaseController
      def index
        scope = policy_scope(StockItem).includes(:product, :unit)
        scope = scope.joins(:product).where('products.name ILIKE ?', "%#{params[:q]}%") if params[:q].present?
        scope = scope.where(status: params[:status]) if params[:status].present?
        scope = apply_numeric_filters(scope, %w[current_stock opening_stock])
        scope = apply_sorting(scope)

        records, meta = paginate(scope)
        render json: {
          data: StockItemSerializer.render_as_hash(records),
          meta: meta
        }
      end

      def show
        item = StockItem.find(params[:id])
        authorize item
        render json: { data: StockItemSerializer.render_as_hash(item) }
      end

      def create
        item = StockItem.new(stock_item_params)
        authorize item
        item.save!
        render json: { data: StockItemSerializer.render_as_hash(item) }, status: :created
      end

      def update
        item = StockItem.find(params[:id])
        authorize item
        item.update!(stock_item_params)
        render json: { data: StockItemSerializer.render_as_hash(item) }
      end

      def destroy
        item = StockItem.find(params[:id])
        authorize item
        item.destroy!
        head :no_content
      end

      def recalculate
        authorize StockItem, :recalculate?
        StockCalculatorService.new.recalculate_all
        render json: { message: 'Stock recalculated successfully' }, status: :ok
      end

      private

      def stock_item_params
        params.permit(:product_id, :category, :unit_id, :opening_stock,
                      :min_level)
      end
    end
  end
end
