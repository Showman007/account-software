module Api
  module V1
    class ProductsController < BaseController
      def index
        scope = policy_scope(Product).includes(:default_unit)
        scope = scope.where('name ILIKE ?', "%#{params[:q]}%") if params[:q].present?
        scope = scope.where(category: params[:category]) if params[:category].present?
        scope = scope.where(direction: params[:direction]) if params[:direction].present?
        scope = apply_sorting(scope)

        records, meta = paginate(scope)
        render json: {
          data: ProductSerializer.render_as_hash(records),
          meta: meta
        }
      end

      def show
        product = Product.find(params[:id])
        authorize product
        render json: { data: ProductSerializer.render_as_hash(product) }
      end

      def create
        product = Product.new(product_params)
        authorize product
        product.save!
        render json: { data: ProductSerializer.render_as_hash(product) }, status: :created
      end

      def update
        product = Product.find(params[:id])
        authorize product
        product.update!(product_params)
        render json: { data: ProductSerializer.render_as_hash(product) }
      end

      def destroy
        product = Product.find(params[:id])
        authorize product
        product.destroy!
        head :no_content
      end

      private

      def product_params
        params.permit(:name, :category, :direction, :default_unit_id)
      end
    end
  end
end
