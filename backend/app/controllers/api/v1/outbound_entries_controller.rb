module Api
  module V1
    class OutboundEntriesController < BaseController
      def index
        scope = policy_scope(OutboundEntry).includes(:party, :product, :unit, :attachment)
        scope = scope.joins(:party).where('parties.name ILIKE ?', "%#{params[:q]}%") if params[:q].present?
        scope = scope.where(party_id: params[:party_id]) if params[:party_id].present?
        scope = scope.where(product_id: params[:product_id]) if params[:product_id].present?
        scope = apply_filters(scope)
        scope = apply_numeric_filters(scope, %w[qty rate amount total_bill])
        scope = apply_sorting(scope)

        records, meta = paginate(scope)
        render json: {
          data: OutboundEntrySerializer.render_as_hash(records),
          meta: meta
        }
      end

      def show
        entry = OutboundEntry.find(params[:id])
        authorize entry
        render json: { data: OutboundEntrySerializer.render_as_hash(entry) }
      end

      def create
        entry = OutboundEntry.new(outbound_entry_params)
        authorize entry
        entry.save!
        render json: { data: OutboundEntrySerializer.render_as_hash(entry) }, status: :created
      end

      def update
        entry = OutboundEntry.find(params[:id])
        authorize entry
        entry.update!(outbound_entry_params)
        render json: { data: OutboundEntrySerializer.render_as_hash(entry) }
      end

      def destroy
        entry = OutboundEntry.find(params[:id])
        authorize entry
        entry.destroy!
        head :no_content
      end

      private

      def outbound_entry_params
        params.permit(:date, :party_id, :city, :product_id, :category,
                      :bag_type, :no_of_bags, :qty, :unit_id, :rate, :transport, :received)
      end
    end
  end
end
