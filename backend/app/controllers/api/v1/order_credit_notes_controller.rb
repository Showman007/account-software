module Api
  module V1
    class OrderCreditNotesController < BaseController
      def index
        order = Order.find(params[:order_id])
        scope = policy_scope(order.order_credit_notes).includes(credit_note_items: [:product, :unit])
        scope = apply_sorting(scope)

        records, meta = paginate(scope)
        render json: {
          data: OrderCreditNoteSerializer.render_as_hash(records),
          meta: meta
        }
      end

      def show
        credit_note = OrderCreditNote.includes(credit_note_items: [:product, :unit]).find(params[:id])
        authorize credit_note
        render json: { data: OrderCreditNoteSerializer.render_as_hash(credit_note) }
      end

      def create
        order = Order.find(params[:order_id])
        delivery = order.deliveries.find(params[:delivery_id])
        authorize OrderCreditNote
        credit_note = OrderCreditNoteService.create(order, delivery, credit_note_params, user: current_user)
        render json: { data: OrderCreditNoteSerializer.render_as_hash(credit_note) }, status: :created
      end

      private

      def credit_note_params
        params.permit(
          :date, :reason, :remarks,
          credit_note_items_attributes: [:delivery_item_id, :product_id, :qty, :unit_id, :rate]
        )
      end
    end
  end
end
