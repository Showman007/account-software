module Api
  module V1
    class BillsController < BaseController
      BILL_CONFIG = {
        "customer_invoice" => { model: OutboundEntry, includes: [:party, :product, :unit] },
        "credit_note" => { model: InboundEntry, includes: [:party, :product, :unit] },
        "payment_receipt" => { model: Payment, includes: [:party, :payment_mode] }
      }.freeze

      def show
        bill_type = params[:bill_type]
        config = BILL_CONFIG[bill_type]

        unless config
          return render json: { error: "Invalid bill type. Use: #{BILL_CONFIG.keys.join(', ')}" }, status: :bad_request
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
