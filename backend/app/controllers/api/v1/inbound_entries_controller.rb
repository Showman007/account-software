module Api
  module V1
    class InboundEntriesController < BaseController
      def index
        scope = policy_scope(InboundEntry).includes(:party, :product, :unit, :attachment)
        scope = scope.joins(:party).where('parties.name ILIKE ?', "%#{params[:q]}%") if params[:q].present?
        scope = scope.where(party_id: params[:party_id]) if params[:party_id].present?
        scope = scope.where(product_id: params[:product_id]) if params[:product_id].present?
        scope = apply_filters(scope)
        scope = apply_numeric_filters(scope, %w[qty rate net_amt gross_amt])
        scope = apply_sorting(scope)

        records, meta = paginate(scope)
        render json: {
          data: InboundEntrySerializer.render_as_hash(records),
          meta: meta
        }
      end

      def show
        entry = InboundEntry.find(params[:id])
        authorize entry
        render json: { data: InboundEntrySerializer.render_as_hash(entry) }
      end

      def create
        entry = InboundEntry.new(inbound_entry_params)
        authorize entry
        entry.save!
        render json: { data: InboundEntrySerializer.render_as_hash(entry) }, status: :created
      end

      def update
        entry = InboundEntry.find(params[:id])
        authorize entry
        entry.update!(inbound_entry_params)
        render json: { data: InboundEntrySerializer.render_as_hash(entry) }
      end

      def destroy
        entry = InboundEntry.find(params[:id])
        authorize entry
        entry.destroy!
        head :no_content
      end

      private

      def inbound_entry_params
        params.permit(:date, :party_id, :village, :product_id, :category,
                      :bag_type, :no_of_bags, :qty, :unit_id, :rate, :moisture_pct, :paid)
      end
    end
  end
end
