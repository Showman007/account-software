module Api
  module V1
    class DeliveriesController < BaseController
      def index
        order = Order.find(params[:order_id])
        scope = policy_scope(order.deliveries).includes(delivery_items: [:product, :unit])
        scope = apply_sorting(scope)

        records, meta = paginate(scope)
        render json: {
          data: DeliverySerializer.render_as_hash(records),
          meta: meta
        }
      end

      def show
        delivery = Delivery.includes(delivery_items: [:product, :unit]).find(params[:id])
        authorize delivery
        render json: { data: DeliverySerializer.render_as_hash(delivery) }
      end

      def create
        order = Order.find(params[:order_id])
        authorize Delivery
        delivery = DeliveryService.create(order, delivery_params, user: current_user)
        render json: { data: DeliverySerializer.render_as_hash(delivery) }, status: :created
      end

      def mark_in_transit
        delivery = Delivery.find(params[:id])
        authorize delivery
        DeliveryService.mark_in_transit(delivery, user: current_user)
        render json: { data: DeliverySerializer.render_as_hash(delivery.reload) }
      end

      def mark_delivered
        delivery = Delivery.find(params[:id])
        authorize delivery
        DeliveryService.mark_delivered(delivery, user: current_user)
        render json: { data: DeliverySerializer.render_as_hash(delivery.reload) }
      end

      private

      def delivery_params
        params.permit(
          :date, :transport, :vehicle_no, :driver_name, :remarks,
          delivery_items_attributes: [:id, :order_item_id, :product_id, :qty, :unit_id, :_destroy]
        )
      end
    end
  end
end
