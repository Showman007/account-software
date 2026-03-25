module Api
  module V1
    class UnitsController < BaseController
      def index
        scope = policy_scope(Unit)
        scope = scope.where('name ILIKE ?', "%#{params[:q]}%") if params[:q].present?
        scope = apply_sorting(scope)

        records, meta = paginate(scope)
        render json: {
          data: UnitSerializer.render_as_hash(records),
          meta: meta
        }
      end

      def show
        unit = Unit.find(params[:id])
        authorize unit
        render json: { data: UnitSerializer.render_as_hash(unit) }
      end

      def create
        unit = Unit.new(unit_params)
        authorize unit
        unit.save!
        render json: { data: UnitSerializer.render_as_hash(unit) }, status: :created
      end

      def update
        unit = Unit.find(params[:id])
        authorize unit
        unit.update!(unit_params)
        render json: { data: UnitSerializer.render_as_hash(unit) }
      end

      def destroy
        unit = Unit.find(params[:id])
        authorize unit
        unit.destroy!
        head :no_content
      end

      private

      def unit_params
        params.permit(:name, :abbreviation)
      end
    end
  end
end
