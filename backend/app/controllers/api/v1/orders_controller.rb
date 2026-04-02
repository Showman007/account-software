module Api
  module V1
    class OrdersController < BaseController
      def index
        scope = policy_scope(Order).includes(:party, order_items: [:product, :unit])
        scope = scope.joins(:party).where("parties.name ILIKE ?", "%#{params[:q]}%") if params[:q].present?
        scope = scope.where(party_id: params[:party_id]) if params[:party_id].present?
        scope = scope.where(status: params[:status]) if params[:status].present?
        scope = apply_filters(scope)
        scope = apply_sorting(scope)

        records, meta = paginate(scope)
        render json: {
          data: OrderSerializer.render_as_hash(records),
          meta: meta
        }
      end

      def show
        order = Order.includes(
          :party, :order_events,
          order_items: [:product, :unit],
          deliveries: { delivery_items: [:product, :unit] },
          order_credit_notes: { credit_note_items: [:product, :unit] }
        ).find(params[:id])
        authorize order
        render json: { data: OrderSerializer.render_as_hash(order) }
      end

      def create
        authorize Order
        order = OrderService.create(order_params, user: current_user)
        render json: { data: OrderSerializer.render_as_hash(order) }, status: :created
      end

      def update
        order = Order.find(params[:id])
        authorize order
        order = OrderService.update(order, order_params, user: current_user)
        render json: { data: OrderSerializer.render_as_hash(order) }
      end

      def confirm
        order = Order.find(params[:id])
        authorize order
        OrderService.confirm(order, user: current_user)
        track_activity(action: 'confirm', record: order)
        render json: { data: OrderSerializer.render_as_hash(order.reload) }
      end

      def cancel
        order = Order.find(params[:id])
        authorize order
        OrderService.cancel(order, reason: params[:reason], user: current_user)
        track_activity(action: 'cancel', record: order, metadata: { reason: params[:reason] })
        render json: { data: OrderSerializer.render_as_hash(order.reload) }
      end

      def close
        order = Order.find(params[:id])
        authorize order
        OrderService.close(order, user: current_user)
        track_activity(action: 'close', record: order)
        render json: { data: OrderSerializer.render_as_hash(order.reload) }
      end

      def duplicate
        order = Order.find(params[:id])
        authorize order
        new_order = OrderService.duplicate(order, user: current_user)
        track_activity(action: 'duplicate', record: new_order, metadata: { source_order_id: order.id })
        render json: { data: OrderSerializer.render_as_hash(new_order) }, status: :created
      end

      def destroy
        order = Order.find(params[:id])
        authorize order
        order.destroy!
        head :no_content
      end

      private

      def order_params
        params.permit(
          :date, :party_id, :city, :discount, :valid_until, :remarks,
          order_items_attributes: [:id, :product_id, :category, :bag_type, :no_of_bags, :qty, :unit_id, :rate, :_destroy]
        )
      end
    end
  end
end
