module Api
  module V1
    class MillingBatchesController < BaseController
      def index
        scope = policy_scope(MillingBatch)
        scope = scope.where('paddy_type ILIKE ? OR miller_name ILIKE ?', "%#{params[:q]}%", "%#{params[:q]}%") if params[:q].present?
        scope = apply_filters(scope)
        scope = apply_numeric_filters(scope, %w[input_qty rice_main_qty milling_cost])
        scope = apply_sorting(scope)

        records, meta = paginate(scope)
        render json: {
          data: MillingBatchSerializer.render_as_hash(records),
          meta: meta
        }
      end

      def show
        batch = MillingBatch.find(params[:id])
        authorize batch
        render json: { data: MillingBatchSerializer.render_as_hash(batch) }
      end

      def create
        batch = MillingBatch.new(milling_batch_params)
        authorize batch
        batch.save!
        render json: { data: MillingBatchSerializer.render_as_hash(batch) }, status: :created
      end

      def update
        batch = MillingBatch.find(params[:id])
        authorize batch
        batch.update!(milling_batch_params)
        render json: { data: MillingBatchSerializer.render_as_hash(batch) }
      end

      def destroy
        batch = MillingBatch.find(params[:id])
        authorize batch
        batch.destroy!
        head :no_content
      end

      private

      def milling_batch_params
        params.permit(:date, :paddy_type, :miller_name, :input_qty,
                      :milling_cost, :rice_main_qty, :broken_rice_qty,
                      :rice_bran_qty, :husk_qty, :rice_flour_qty)
      end
    end
  end
end
