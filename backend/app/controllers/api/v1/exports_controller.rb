module Api
  module V1
    class ExportsController < BaseController
      def show
        export_type = params[:id]
        from_date = params[:from_date]
        to_date = params[:to_date]

        case export_type
        when 'inbound_entries'
          records = InboundEntry.includes(:party, :product, :unit)
          records = records.where('date >= ?', from_date) if from_date
          records = records.where('date <= ?', to_date) if to_date
          records = records.order(date: :desc)
          send_excel(export_inbound(records), 'inbound_entries')
        when 'outbound_entries'
          records = OutboundEntry.includes(:party, :product, :unit)
          records = records.where('date >= ?', from_date) if from_date
          records = records.where('date <= ?', to_date) if to_date
          records = records.order(date: :desc)
          send_excel(export_outbound(records), 'outbound_entries')
        when 'expenses'
          records = Expense.includes(:category, :payment_mode)
          records = records.where('date >= ?', from_date) if from_date
          records = records.where('date <= ?', to_date) if to_date
          records = records.order(date: :desc)
          send_excel(export_expenses(records), 'expenses')
        when 'payments'
          records = Payment.includes(:party, :payment_mode)
          records = records.where('date >= ?', from_date) if from_date
          records = records.where('date <= ?', to_date) if to_date
          records = records.order(date: :desc)
          send_excel(export_payments(records), 'payments')
        when 'milling_batches'
          records = MillingBatch.all
          records = records.where('date >= ?', from_date) if from_date
          records = records.where('date <= ?', to_date) if to_date
          records = records.order(date: :desc)
          send_excel(export_milling(records), 'milling_batches')
        when 'parties'
          records = Party.order(:name)
          send_excel(export_parties(records), 'parties')
        else
          render json: { error: 'Invalid export type' }, status: :bad_request
        end
      end

      private

      def send_excel(package, filename)
        temp = Tempfile.new([filename, '.xlsx'])
        package.serialize(temp.path)
        send_file temp.path,
                  filename: "#{filename}_#{Date.today}.xlsx",
                  type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      end

      def export_inbound(records)
        Axlsx::Package.new do |p|
          p.workbook.add_worksheet(name: 'Inbound Entries') do |sheet|
            sheet.add_row ['Date', 'Party', 'Village', 'Product', 'Qty', 'Unit', 'Rate', 'Gross Amt', 'Moisture %', 'Deduction', 'Net Qty', 'Net Amt', 'Paid', 'Balance']
            records.each do |r|
              sheet.add_row [r.date, r.party&.name, r.party&.village_city, r.product&.name, r.qty&.to_f, r.unit&.abbreviation, r.rate&.to_f, r.gross_amt&.to_f, r.moisture_pct&.to_f, r.deduction_amt&.to_f, r.net_qty&.to_f, r.net_amt&.to_f, r.paid&.to_f, r.balance&.to_f]
            end
          end
        end
      end

      def export_outbound(records)
        Axlsx::Package.new do |p|
          p.workbook.add_worksheet(name: 'Outbound Entries') do |sheet|
            sheet.add_row ['Date', 'Party', 'Village', 'Product', 'Qty', 'Unit', 'Rate', 'Amount', 'Transport', 'Total Bill', 'Received', 'Balance']
            records.each do |r|
              sheet.add_row [r.date, r.party&.name, r.party&.village_city, r.product&.name, r.qty&.to_f, r.unit&.abbreviation, r.rate&.to_f, r.amount&.to_f, r.transport&.to_f, r.total_bill&.to_f, r.received&.to_f, r.balance&.to_f]
            end
          end
        end
      end

      def export_expenses(records)
        Axlsx::Package.new do |p|
          p.workbook.add_worksheet(name: 'Expenses') do |sheet|
            sheet.add_row ['Date', 'Description', 'Category', 'Paid To', 'Amount', 'Payment Mode', 'Remarks']
            records.each do |r|
              sheet.add_row [r.date, r.description, r.category&.name, r.paid_to, r.amount&.to_f, r.payment_mode&.name, r.remarks]
            end
          end
        end
      end

      def export_payments(records)
        Axlsx::Package.new do |p|
          p.workbook.add_worksheet(name: 'Payments') do |sheet|
            sheet.add_row ['Date', 'Party', 'Direction', 'Amount', 'Payment Mode', 'Reference']
            records.each do |r|
              sheet.add_row [r.date, r.party&.name, r.direction, r.amount&.to_f, r.payment_mode&.name, r.reference]
            end
          end
        end
      end

      def export_milling(records)
        Axlsx::Package.new do |p|
          p.workbook.add_worksheet(name: 'Milling Batches') do |sheet|
            sheet.add_row ['Date', 'Paddy Type', 'Miller', 'Input Qty', 'Rice Qty', 'Broken Qty', 'Bran Qty', 'Husk Qty', 'Flour Qty', 'Total Output', 'Loss', 'Milling Cost']
            records.each do |r|
              sheet.add_row [r.date, r.paddy_type, r.miller_name, r.input_qty&.to_f, r.rice_qty&.to_f, r.broken_qty&.to_f, r.bran_qty&.to_f, r.husk_qty&.to_f, r.flour_qty&.to_f, r.total_output&.to_f, r.loss&.to_f, r.milling_cost&.to_f]
            end
          end
        end
      end

      def export_parties(records)
        Axlsx::Package.new do |p|
          p.workbook.add_worksheet(name: 'Parties') do |sheet|
            sheet.add_row ['Name', 'Village/City', 'Phone', 'Type', 'Opening Balance', 'Bank Name', 'Account Number', 'IFSC']
            records.each do |r|
              sheet.add_row [r.name, r.village_city, r.phone, r.party_type, r.opening_balance&.to_f, r.bank_name, r.account_number, r.ifsc_code]
            end
          end
        end
      end
    end
  end
end
