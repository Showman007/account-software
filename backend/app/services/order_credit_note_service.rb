class OrderCreditNoteService
  class << self
    # Create a credit note against a delivery (for returns/damaged goods)
    def create(order, delivery, params, user: nil)
      ActiveRecord::Base.transaction do
        credit_note = order.order_credit_notes.new(params)
        credit_note.delivery = delivery
        credit_note.save!

        # Reverse the outbound entries for returned items
        reverse_outbound_entries(credit_note)

        # Recalculate order item quantities
        credit_note.credit_note_items.each do |cni|
          cni.delivery_item.order_item.recalculate_quantities!
        end

        # Recalculate order status (may revert to partial_delivered)
        order.recalculate_status!
        order.recalculate_financials!

        order.record_event!(:credit_note_issued,
                           remarks: "Credit note #{credit_note.credit_note_number} issued for delivery #{delivery.delivery_number}",
                           user: user)

        # Recalculate stock for affected products
        affected_product_ids = credit_note.credit_note_items.pluck(:product_id).uniq
        calculator = StockCalculatorService.new
        Product.where(id: affected_product_ids).find_each do |product|
          calculator.recalculate_for_product(product)
        end

        credit_note
      end
    end

    private

    # For each credit note item, find the outbound entry from the delivery
    # and create a reversal outbound entry (negative) or adjust quantities
    def reverse_outbound_entries(credit_note)
      credit_note.credit_note_items.includes(delivery_item: :outbound_entry).each do |cni|
        original_outbound = cni.delivery_item.outbound_entry
        next unless original_outbound

        # If returning full qty, reverse the entire outbound entry
        if cni.qty == cni.delivery_item.qty
          original_outbound.destroy!
        else
          # Partial return: reduce qty on the outbound entry
          new_qty = original_outbound.qty - cni.qty
          original_outbound.update!(qty: new_qty)
        end
      end
    end
  end
end
