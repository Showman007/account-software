module Api
  module V1
    class PartiesController < BaseController
      def index
        scope = policy_scope(Party)
        scope = scope.where('name ILIKE ?', "%#{params[:q]}%") if params[:q].present?
        scope = scope.where(party_type: params[:party_type]) if params[:party_type].present?
        scope = apply_sorting(scope)

        records, meta = paginate(scope)
        render json: {
          data: PartySerializer.render_as_hash(records),
          meta: meta
        }
      end

      def show
        party = Party.find(params[:id])
        authorize party
        render json: { data: PartySerializer.render_as_hash(party) }
      end

      def create
        party = Party.new(party_params)
        authorize party
        party.save!
        render json: { data: PartySerializer.render_as_hash(party) }, status: :created
      end

      def update
        party = Party.find(params[:id])
        authorize party
        party.update!(party_params)
        render json: { data: PartySerializer.render_as_hash(party) }
      end

      def destroy
        party = Party.find(params[:id])
        authorize party
        party.destroy!
        head :no_content
      end

      private

      def party_params
        params.permit(:name, :village_city, :phone, :opening_balance,
                      :party_type, :account_no, :bank, :notes)
      end
    end
  end
end
