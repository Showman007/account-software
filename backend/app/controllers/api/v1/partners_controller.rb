module Api
  module V1
    class PartnersController < BaseController
      def index
        scope = policy_scope(Partner)
        scope = scope.where('name ILIKE ?', "%#{params[:q]}%") if params[:q].present?
        scope = scope.where(status: params[:status]) if params[:status].present?
        scope = apply_sorting(scope)

        records, meta = paginate(scope)
        render json: {
          data: PartnerSerializer.render_as_hash(records),
          meta: meta
        }
      end

      def show
        partner = Partner.find(params[:id])
        authorize partner
        render json: { data: PartnerSerializer.render_as_hash(partner) }
      end

      def create
        partner = Partner.new(partner_params)
        authorize partner
        partner.save!
        render json: { data: PartnerSerializer.render_as_hash(partner) }, status: :created
      end

      def update
        partner = Partner.find(params[:id])
        authorize partner
        partner.update!(partner_params)
        render json: { data: PartnerSerializer.render_as_hash(partner) }
      end

      def destroy
        partner = Partner.find(params[:id])
        authorize partner
        partner.destroy!
        head :no_content
      end

      private

      def partner_params
        params.permit(:name, :phone, :date_joined, :profit_share_type,
                      :profit_share_rate, :status)
      end
    end
  end
end
