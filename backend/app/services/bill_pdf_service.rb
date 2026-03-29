require "prawn"
require "prawn/table"

class BillPdfService
  COMPANY_NAME = "SMLTC"
  COMPANY_TAGLINE = "Sri Mahalakshmi Lakshmi Trading Company"

  BILL_TYPES = %w[customer_invoice credit_note payment_receipt].freeze

  def initialize(bill_type, record)
    raise ArgumentError, "Invalid bill type: #{bill_type}" unless BILL_TYPES.include?(bill_type)

    @bill_type = bill_type
    @record = record
  end

  def generate
    pdf = Prawn::Document.new(page_size: "A4", margin: 40)

    render_header(pdf)
    render_separator(pdf)

    case @bill_type
    when "customer_invoice"
      render_customer_invoice(pdf)
    when "credit_note"
      render_credit_note(pdf)
    when "payment_receipt"
      render_payment_receipt(pdf)
    end

    render_footer(pdf)
    pdf.render
  end

  def filename
    date = @record.date.strftime("%Y%m%d")
    case @bill_type
    when "customer_invoice"
      "Invoice_#{@record.id}_#{date}.pdf"
    when "credit_note"
      "CreditNote_#{@record.id}_#{date}.pdf"
    when "payment_receipt"
      "Receipt_#{@record.id}_#{date}.pdf"
    end
  end

  private

  def render_header(pdf)
    pdf.font_size(20) { pdf.text COMPANY_NAME, style: :bold, align: :center }
    pdf.font_size(10) { pdf.text COMPANY_TAGLINE, align: :center, color: "666666" }
    pdf.move_down 5

    title = case @bill_type
            when "customer_invoice" then "CUSTOMER INVOICE"
            when "credit_note" then "CREDIT NOTE"
            when "payment_receipt" then "PAYMENT RECEIPT"
            end

    pdf.font_size(14) { pdf.text title, style: :bold, align: :center, color: "333333" }
    pdf.move_down 10
  end

  def render_separator(pdf)
    pdf.stroke_horizontal_rule
    pdf.move_down 15
  end

  def render_customer_invoice(pdf)
    entry = @record
    party = entry.party
    product = entry.product
    unit = entry.unit

    # Bill info + Party info side by side
    pdf.font_size(10) do
      pdf.text_box "Invoice No: INV-#{entry.id}", at: [0, pdf.cursor], width: 250
      pdf.text_box "Date: #{entry.date.strftime('%d-%m-%Y')}", at: [300, pdf.cursor], width: 200, align: :right
    end
    pdf.move_down 20

    # Bill To
    pdf.font_size(11) { pdf.text "Bill To:", style: :bold }
    pdf.font_size(10) do
      pdf.text party.name, style: :bold
      pdf.text party.village_city if party.village_city.present?
      pdf.text "Phone: #{party.phone}" if party.phone.present?
    end
    pdf.move_down 15

    # Items table
    items_data = [
      ["#", "Product", "Category", "Qty", "Unit", "Rate", "Amount"]
    ]

    items_data << [
      "1",
      product.name,
      entry.category || "-",
      format_number(entry.qty),
      unit.abbreviation,
      format_inr(entry.rate),
      format_inr(entry.amount)
    ]

    pdf.table(items_data, header: true, width: pdf.bounds.width) do |t|
      t.row(0).font_style = :bold
      t.row(0).background_color = "E8E8E8"
      t.columns(0).width = 30
      t.columns(3..6).align = :right
      t.cell_style = { size: 10, padding: [6, 8] }
    end

    pdf.move_down 10

    # Summary
    summary_data = []
    summary_data << ["Sub Total", format_inr(entry.amount)]
    if entry.transport.to_f > 0
      summary_data << ["Transport", format_inr(entry.transport)]
    end
    summary_data << [{ content: "Total Bill", font_style: :bold }, { content: format_inr(entry.total_bill), font_style: :bold }]
    summary_data << ["Received", format_inr(entry.received)]
    summary_data << [{ content: "Balance Due", font_style: :bold }, { content: format_inr(entry.balance), font_style: :bold }]

    pdf.table(summary_data, position: :right, width: 250) do |t|
      t.columns(1).align = :right
      t.cell_style = { size: 10, padding: [5, 8] }
      t.row(-1).background_color = "F5F5F5"
    end
  end

  def render_credit_note(pdf)
    entry = @record
    party = entry.party
    product = entry.product
    unit = entry.unit

    # Note info
    pdf.font_size(10) do
      pdf.text_box "Credit Note No: CN-#{entry.id}", at: [0, pdf.cursor], width: 250
      pdf.text_box "Date: #{entry.date.strftime('%d-%m-%Y')}", at: [300, pdf.cursor], width: 200, align: :right
    end
    pdf.move_down 20

    # From (Supplier)
    pdf.font_size(11) { pdf.text "Supplier:", style: :bold }
    pdf.font_size(10) do
      pdf.text party.name, style: :bold
      pdf.text party.village_city if party.village_city.present?
      pdf.text "Phone: #{party.phone}" if party.phone.present?
    end
    pdf.move_down 15

    # Items table
    items_data = [
      ["#", "Product", "Category", "Qty", "Unit", "Rate", "Gross Amt"]
    ]

    items_data << [
      "1",
      product.name,
      entry.category || "-",
      format_number(entry.qty),
      unit.abbreviation,
      format_inr(entry.rate),
      format_inr(entry.gross_amt)
    ]

    pdf.table(items_data, header: true, width: pdf.bounds.width) do |t|
      t.row(0).font_style = :bold
      t.row(0).background_color = "E8E8E8"
      t.columns(0).width = 30
      t.columns(3..6).align = :right
      t.cell_style = { size: 10, padding: [6, 8] }
    end

    pdf.move_down 10

    # Summary
    summary_data = []
    summary_data << ["Gross Amount", format_inr(entry.gross_amt)]
    if entry.moisture_pct.to_f > 0
      summary_data << ["Moisture (#{entry.moisture_pct}%)", "- #{format_inr(entry.deduction_amt)}"]
    end
    summary_data << [{ content: "Net Amount", font_style: :bold }, { content: format_inr(entry.net_amt), font_style: :bold }]
    summary_data << ["Paid", format_inr(entry.paid)]
    summary_data << [{ content: "Balance Due", font_style: :bold }, { content: format_inr(entry.balance), font_style: :bold }]

    pdf.table(summary_data, position: :right, width: 250) do |t|
      t.columns(1).align = :right
      t.cell_style = { size: 10, padding: [5, 8] }
      t.row(-1).background_color = "F5F5F5"
    end
  end

  def render_payment_receipt(pdf)
    payment = @record
    party = payment.party
    mode = payment.payment_mode

    # Receipt info
    pdf.font_size(10) do
      pdf.text_box "Receipt No: REC-#{payment.id}", at: [0, pdf.cursor], width: 250
      pdf.text_box "Date: #{payment.date.strftime('%d-%m-%Y')}", at: [300, pdf.cursor], width: 200, align: :right
    end
    pdf.move_down 20

    direction_label = payment.payment_to_supplier? ? "Paid To" : "Received From"
    direction_type = payment.payment_to_supplier? ? "Payment to Supplier" : "Receipt from Buyer"

    pdf.font_size(11) { pdf.text "#{direction_label}:", style: :bold }
    pdf.font_size(10) do
      pdf.text party.name, style: :bold
      pdf.text party.village_city if party.village_city.present?
      pdf.text "Phone: #{party.phone}" if party.phone.present?
    end
    pdf.move_down 15

    # Payment details table
    details_data = [
      ["Detail", "Value"],
      ["Type", direction_type],
      ["Amount", { content: format_inr(payment.amount), font_style: :bold }],
      ["Payment Mode", mode&.name || "-"],
      ["Reference", payment.reference.present? ? payment.reference : "-"],
      ["Remarks", payment.remarks.present? ? payment.remarks : "-"],
    ]

    pdf.table(details_data, header: true, width: pdf.bounds.width) do |t|
      t.row(0).font_style = :bold
      t.row(0).background_color = "E8E8E8"
      t.columns(0).width = 150
      t.cell_style = { size: 10, padding: [6, 8] }
    end

    pdf.move_down 20

    # Amount in words box
    pdf.bounding_box([0, pdf.cursor], width: pdf.bounds.width) do
      pdf.stroke_rectangle [0, pdf.cursor], pdf.bounds.width, 35
      pdf.move_down 8
      pdf.indent(10) do
        pdf.font_size(10) do
          pdf.text "Amount: #{format_inr(payment.amount)}", style: :bold
        end
      end
    end
  end

  def render_footer(pdf)
    pdf.move_down 40
    render_separator(pdf)

    # Signature areas
    pdf.font_size(10) do
      pdf.text_box "Authorized Signature", at: [0, pdf.cursor], width: 200
      pdf.text_box "Receiver's Signature", at: [pdf.bounds.width - 200, pdf.cursor], width: 200, align: :right
    end

    pdf.move_down 40
    pdf.font_size(8) do
      pdf.text "This is a computer-generated document.", align: :center, color: "999999"
      pdf.text "Generated on #{Time.current.strftime('%d-%m-%Y %I:%M %p')}", align: :center, color: "999999"
    end
  end

  def format_inr(amount)
    return "0.00" unless amount

    parts = format("%.2f", amount).split(".")
    integer_part = parts[0].reverse.scan(/\d{1,3}/).join(",").reverse
    # Fix negative sign position
    if integer_part.start_with?("-,")
      integer_part = "-" + integer_part[2..]
    end
    "Rs. #{integer_part}.#{parts[1]}"
  end

  def format_number(num)
    return "0" unless num

    num.to_f == num.to_f.to_i ? num.to_i.to_s : format("%.3f", num)
  end
end
