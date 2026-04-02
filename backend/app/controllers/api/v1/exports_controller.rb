module Api
  module V1
    class ExportsController < BaseController
      def show
        export_type = params[:id]

        case export_type
        when 'inbound_entries'
          records = InboundEntry.includes(:party, :product, :unit)
          records = records.joins(:party).where('parties.name ILIKE ?', "%#{params[:q]}%") if params[:q].present?
          records = records.where(party_id: params[:party_id]) if params[:party_id].present?
          records = records.where(product_id: params[:product_id]) if params[:product_id].present?
          records = apply_date_filter(records)
          records = records.order(date: :desc)
          send_excel(export_inbound(records), 'inbound_entries')
        when 'outbound_entries'
          records = OutboundEntry.includes(:party, :product, :unit)
          records = records.joins(:party).where('parties.name ILIKE ?', "%#{params[:q]}%") if params[:q].present?
          records = records.where(party_id: params[:party_id]) if params[:party_id].present?
          records = records.where(product_id: params[:product_id]) if params[:product_id].present?
          records = apply_date_filter(records)
          records = records.order(date: :desc)
          send_excel(export_outbound(records), 'outbound_entries')
        when 'expenses'
          records = Expense.includes(:category, :payment_mode)
          records = records.where('description ILIKE ?', "%#{params[:q]}%") if params[:q].present?
          records = records.where(expense_category_id: params[:category_id]) if params[:category_id].present?
          records = apply_date_filter(records)
          records = records.order(date: :desc)
          send_excel(export_expenses(records), 'expenses')
        when 'payments'
          records = Payment.includes(:party, :payment_mode)
          records = records.joins(:party).where('parties.name ILIKE ?', "%#{params[:q]}%") if params[:q].present?
          records = records.where(direction: params[:direction]) if params[:direction].present?
          records = apply_date_filter(records)
          records = records.order(date: :desc)
          send_excel(export_payments(records), 'payments')
        when 'milling_batches'
          records = MillingBatch.all
          records = records.where('paddy_type ILIKE ? OR miller_name ILIKE ?', "%#{params[:q]}%", "%#{params[:q]}%") if params[:q].present?
          records = apply_date_filter(records)
          records = records.order(date: :desc)
          send_excel(export_milling(records), 'milling_batches')
        when 'parties'
          records = Party.all
          records = records.where('name ILIKE ? OR village_city ILIKE ?', "%#{params[:q]}%", "%#{params[:q]}%") if params[:q].present?
          records = records.where(party_type: params[:party_type]) if params[:party_type].present?
          records = records.order(:name)
          send_excel(export_parties(records), 'parties')
        when 'journal_entries'
          records = JournalEntry.includes(:journal_lines)
          records = records.where('narration ILIKE ?', "%#{params[:q]}%") if params[:q].present?
          records = records.where(entry_type: params[:entry_type]) if params[:entry_type].present?
          records = apply_date_filter(records)
          records = records.order(date: :desc, id: :desc)
          send_excel(export_journals(records), 'journal_entries')
        when 'stock_items'
          records = StockItem.includes(:product, :unit)
          records = records.joins(:product).where('products.name ILIKE ?', "%#{params[:q]}%") if params[:q].present?
          records = records.order('products.name')
          send_excel(export_stock_items(records), 'stock_items')
        when 'credit_transactions'
          records = CreditTransaction.includes(:partner, :payment_mode)
          records = records.joins(:partner).where('partners.name ILIKE ?', "%#{params[:q]}%") if params[:q].present?
          records = apply_date_filter(records)
          records = records.order(date: :desc)
          send_excel(export_credit_transactions(records), 'credit_transactions')
        when 'partners'
          records = Partner.all
          records = records.where('name ILIKE ?', "%#{params[:q]}%") if params[:q].present?
          records = records.order(:name)
          send_excel(export_partners(records), 'partners')
        else
          render json: { error: 'Invalid export type' }, status: :bad_request
        end
      end

      private

      def apply_date_filter(scope)
        scope = scope.where('date >= ?', params[:from_date]) if params[:from_date].present?
        scope = scope.where('date <= ?', params[:to_date]) if params[:to_date].present?
        scope
      end

      def send_excel(package, filename)
        track_activity(action: 'export', metadata: { export_type: filename })
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
            sheet.add_row ['Date', 'Party', 'Direction', 'Amount', 'Payment Mode', 'Reference', 'Status']
            records.each do |r|
              status = r.is_reversal? ? 'Reversal' : (r.reversed? ? 'Reversed' : 'Active')
              direction_label = ::PAYMENT_LABELS[r.direction.to_sym][r.is_reversal? ? :reversal_label : :label]
              sheet.add_row [r.date, r.party&.name, direction_label, r.amount&.to_f, r.payment_mode&.name, r.reference, status]
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
            sheet.add_row ['Name', 'Village/City', 'Phone', 'Type', 'Opening Balance', 'Bank', 'Account No']
            records.each do |r|
              sheet.add_row [r.name, r.village_city, r.phone, r.party_type, r.opening_balance&.to_f, r.bank, r.account_no]
            end
          end
        end
      end

      def export_journals(records)
        Axlsx::Package.new do |p|
          p.workbook.add_worksheet(name: 'Journal Entries') do |sheet|
            sheet.add_row ['Date', 'Entry #', 'Narration', 'Type', 'Account', 'Debit', 'Credit']
            records.each do |entry|
              entry.journal_lines.each_with_index do |line, i|
                sheet.add_row [
                  i == 0 ? entry.date : nil,
                  i == 0 ? entry.entry_number : nil,
                  i == 0 ? entry.narration : nil,
                  i == 0 ? entry.entry_type : nil,
                  line.account_name,
                  line.debit&.to_f,
                  line.credit&.to_f
                ]
              end
            end
          end
        end
      end

      def export_stock_items(records)
        Axlsx::Package.new do |p|
          p.workbook.add_worksheet(name: 'Stock Items') do |sheet|
            sheet.add_row ['Product', 'Unit', 'Opening Stock', 'Total Inbound', 'From Milling', 'Total Outbound', 'Current Stock', 'Min Level', 'Status']
            records.each do |r|
              status = r.current_stock.to_f <= r.min_level.to_f ? 'Low' : 'OK'
              sheet.add_row [r.product&.name, r.unit&.abbreviation, r.opening_stock&.to_f, r.total_inbound&.to_f, r.from_milling&.to_f, r.total_outbound&.to_f, r.current_stock&.to_f, r.min_level&.to_f, status]
            end
          end
        end
      end

      def export_credit_transactions(records)
        Axlsx::Package.new do |p|
          p.workbook.add_worksheet(name: 'Credit Transactions') do |sheet|
            sheet.add_row ['Date', 'Partner', 'Type', 'Credit Received', 'Principal Returned', 'Profit Paid', 'Payment Mode', 'Remarks']
            records.each do |r|
              sheet.add_row [r.date, r.partner&.name, r.transaction_type&.humanize, r.credit_received&.to_f, r.principal_returned&.to_f, r.profit_paid&.to_f, r.payment_mode&.name, r.remarks]
            end
          end
        end
      end

      def export_partners(records)
        Axlsx::Package.new do |p|
          p.workbook.add_worksheet(name: 'Partners') do |sheet|
            sheet.add_row ['Name', 'Phone', 'Profit Share %', 'Date Joined', 'Total Credit', 'Total Returned', 'Total Profit Paid']
            records.each do |r|
              credit = r.credit_transactions.sum(:credit_received)
              returned = r.credit_transactions.sum(:principal_returned)
              profit = r.credit_transactions.sum(:profit_paid)
              sheet.add_row [r.name, r.phone, r.profit_share_rate&.to_f, r.date_joined, credit.to_f, returned.to_f, profit.to_f]
            end
          end
        end
      end
    end
  end
end
