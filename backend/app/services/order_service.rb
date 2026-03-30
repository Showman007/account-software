class OrderService
  class << self
    # Create a new order (starts as quotation)
    def create(params, user: nil)
      ActiveRecord::Base.transaction do
        order = Order.new(params)
        order.status = :quotation
        order.save!

        order.record_event!(:created, status_to: "quotation", user: user)
        order
      end
    end

    # Update order — only allowed in quotation status
    def update(order, params, user: nil)
      raise ActiveRecord::RecordInvalid.new(order) unless order.editable?

      ActiveRecord::Base.transaction do
        order.update!(params)
        order
      end
    end

    # Confirm a quotation — locks rates/items, moves to confirmed
    def confirm(order, user: nil)
      unless order.quotation?
        order.errors.add(:status, "must be quotation to confirm (current: #{order.status})")
        raise ActiveRecord::RecordInvalid.new(order)
      end

      if order.expired?
        order.errors.add(:valid_until, "quotation has expired, create a new one")
        raise ActiveRecord::RecordInvalid.new(order)
      end

      ActiveRecord::Base.transaction do
        old_status = order.status
        order.update!(status: :confirmed)
        order.record_event!(:confirmed, status_from: old_status, status_to: "confirmed", user: user)
        order
      end
    end

    # Cancel an order — allowed from quotation or confirmed
    def cancel(order, reason: nil, user: nil)
      unless order.cancellable?
        order.errors.add(:status, "cannot cancel order in #{order.status} status")
        raise ActiveRecord::RecordInvalid.new(order)
      end

      ActiveRecord::Base.transaction do
        old_status = order.status
        order.update!(status: :cancelled, rejection_reason: reason)
        order.record_event!(:cancelled, status_from: old_status, status_to: "cancelled",
                           remarks: reason, user: user)
        order
      end
    end

    # Close a fully delivered order
    def close(order, user: nil)
      unless order.delivered?
        order.errors.add(:status, "order must be fully delivered before closing (current: #{order.status})")
        raise ActiveRecord::RecordInvalid.new(order)
      end

      ActiveRecord::Base.transaction do
        old_status = order.status
        order.update!(status: :closed)
        order.record_event!(:closed, status_from: old_status, status_to: "closed", user: user)
        order
      end
    end

    # Duplicate a cancelled/expired quotation into a new one
    def duplicate(order, user: nil)
      ActiveRecord::Base.transaction do
        new_order = Order.new(
          date: Date.current,
          party_id: order.party_id,
          city: order.city,
          status: :quotation,
          discount: order.discount,
          remarks: "Duplicated from #{order.order_number}"
        )

        order.order_items.each do |item|
          new_order.order_items.build(
            product_id: item.product_id,
            category: item.category,
            qty: item.qty,
            unit_id: item.unit_id,
            rate: item.rate
          )
        end

        new_order.save!
        new_order.record_event!(:created, status_to: "quotation",
                                remarks: "Duplicated from #{order.order_number}", user: user)
        new_order
      end
    end
  end
end
