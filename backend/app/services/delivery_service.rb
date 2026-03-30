class DeliveryService
  class << self
    # Create a delivery against an order (status starts as pending)
    def create(order, params, user: nil)
      unless order.deliverable?
        order.errors.add(:status, "order is not in a deliverable status (current: #{order.status})")
        raise ActiveRecord::RecordInvalid.new(order)
      end

      ActiveRecord::Base.transaction do
        delivery = order.deliveries.new(params)
        delivery.save!

        # Move order to processing if it was just confirmed
        if order.confirmed?
          old_status = order.status
          order.update!(status: :processing)
          order.record_event!(:delivery_created, status_from: old_status, status_to: "processing",
                             remarks: "Delivery #{delivery.delivery_number} created", user: user)
        else
          order.record_event!(:delivery_created,
                             remarks: "Delivery #{delivery.delivery_number} created", user: user)
        end

        delivery
      end
    end

    # Mark a delivery as in_transit
    def mark_in_transit(delivery, user: nil)
      unless delivery.pending?
        delivery.errors.add(:status, "delivery must be pending to mark as in transit")
        raise ActiveRecord::RecordInvalid.new(delivery)
      end

      ActiveRecord::Base.transaction do
        delivery.update!(status: :in_transit)

        order = delivery.order
        if order.processing? || order.confirmed?
          old_status = order.status
          order.update!(status: :shipped)
          order.record_event!(:status_change, status_from: old_status, status_to: "shipped",
                             remarks: "Delivery #{delivery.delivery_number} shipped", user: user)
        end

        delivery
      end
    end

    # Mark a delivery as delivered — this triggers outbound entry creation
    def mark_delivered(delivery, user: nil)
      unless delivery.pending? || delivery.in_transit?
        delivery.errors.add(:status, "delivery must be pending or in_transit to mark as delivered")
        raise ActiveRecord::RecordInvalid.new(delivery)
      end

      ActiveRecord::Base.transaction do
        delivery.update!(status: :delivered)
        order = delivery.order

        # Auto-create OutboundEntries for each delivery item
        create_outbound_entries(delivery)

        # Update order item quantities
        delivery.delivery_items.each do |di|
          di.order_item.recalculate_quantities!
        end

        # Recalculate order status and financials
        order.recalculate_status!
        order.recalculate_financials!

        order.record_event!(:delivery_completed,
                           remarks: "Delivery #{delivery.delivery_number} completed", user: user)

        # Recalculate stock
        affected_product_ids = delivery.delivery_items.pluck(:product_id).uniq
        calculator = StockCalculatorService.new
        Product.where(id: affected_product_ids).find_each do |product|
          calculator.recalculate_for_product(product)
        end

        delivery
      end
    end

    private

    # Create one OutboundEntry per DeliveryItem
    def create_outbound_entries(delivery)
      order = delivery.order

      delivery.delivery_items.includes(:order_item, :product, :unit).each do |di|
        OutboundEntry.create!(
          date: delivery.date,
          party_id: order.party_id,
          city: order.city,
          product_id: di.product_id,
          category: di.order_item.category,
          qty: di.qty,
          unit_id: di.unit_id,
          rate: di.order_item.rate,
          transport: calculate_transport_share(delivery, di),
          received: 0,
          order_id: order.id,
          delivery_item_id: di.id
        )
      end
    end

    # Split transport proportionally across items by amount
    def calculate_transport_share(delivery, delivery_item)
      return 0 if delivery.transport.to_f.zero?

      total_value = delivery.delivery_items.includes(:order_item).sum { |di|
        di.qty * di.order_item.rate
      }
      return 0 if total_value.zero?

      item_value = delivery_item.qty * delivery_item.order_item.rate
      (delivery.transport * item_value / total_value).round(2)
    end
  end
end
