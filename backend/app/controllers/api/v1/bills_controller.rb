module Api
  module V1
    class BillsController < BaseController
      BILL_CONFIG = {
        "customer_invoice" => { model: OutboundEntry, includes: [:party, :product, :unit] },
        "credit_note" => { model: InboundEntry, includes: [:party, :product, :unit] },
        "payment_receipt" => { model: Payment, includes: [:party, :payment_mode] },
        "refund_receipt" => { model: Payment, includes: [:party, :payment_mode, :reversed_payment] }
      }.freeze

      ORDER_BILL_CONFIG = {
        "quotation" => { model: Order, includes: [:party, order_items: [:product, :unit]] },
        "order_invoice" => { model: Order, includes: [:party, order_items: [:product, :unit], deliveries: { delivery_items: :product }] },
        "delivery_challan" => { model: Delivery, includes: [:order, delivery_items: [:product, :unit]] },
        "order_credit_note" => { model: OrderCreditNote, includes: [:order, :delivery, credit_note_items: [:product, :unit]] }
      }.freeze

      def show
        bill_type = params[:bill_type]

        # Check order bill types first
        order_config = ORDER_BILL_CONFIG[bill_type]
        if order_config
          record = order_config[:model].includes(*order_config[:includes]).find(params[:id])
          authorize record, :show?

          service = OrderPdfService.new(bill_type, record)
          pdf_data = service.generate

          return send_data pdf_data,
                    filename: service.filename,
                    type: "application/pdf",
                    disposition: "inline"
        end

        # Fall back to original bill types
        config = BILL_CONFIG[bill_type]

        unless config
          all_types = (BILL_CONFIG.keys + ORDER_BILL_CONFIG.keys).join(", ")
          return render json: { error: "Invalid bill type. Use: #{all_types}" }, status: :bad_request
        end

        record = config[:model].includes(*config[:includes]).find(params[:id])
        authorize record, :show?

        service = BillPdfService.new(bill_type, record)
        pdf_data = service.generate

        send_data pdf_data,
                  filename: service.filename,
                  type: "application/pdf",
                  disposition: "inline"
      end
    end
  end
end
