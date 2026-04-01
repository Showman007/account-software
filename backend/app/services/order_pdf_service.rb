require "prawn"
require "prawn/table"

class OrderPdfService
  COMPANY_NAME = "SMLTC"
  COMPANY_TAGLINE = "Sri Mahalakshmi Lakshmi Trading Company"

  BILL_TYPES = %w[quotation order_invoice delivery_challan order_credit_note].freeze

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
    when "quotation"
      render_quotation(pdf)
    when "order_invoice"
      render_order_invoice(pdf)
    when "delivery_challan"
      render_delivery_challan(pdf)
    when "order_credit_note"
      render_order_credit_note(pdf)
    end

    render_footer(pdf)
    pdf.render
  end

  def filename
    date = @record.respond_to?(:date) ? @record.date.strftime("%Y%m%d") : Date.current.strftime("%Y%m%d")
    case @bill_type
    when "quotation"
      "Quotation_#{@record.order_number}_#{date}.pdf"
    when "order_invoice"
      "OrderInvoice_#{@record.order_number}_#{date}.pdf"
    when "delivery_challan"
      "DeliveryChallan_#{@record.delivery_number}_#{date}.pdf"
    when "order_credit_note"
      "CreditNote_#{@record.credit_note_number}_#{date}.pdf"
    end
  end

  private

  def render_header(pdf)
    pdf.font_size(20) { pdf.text COMPANY_NAME, style: :bold, align: :center }
    pdf.font_size(10) { pdf.text COMPANY_TAGLINE, align: :center, color: "666666" }
    pdf.move_down 5

    title = case @bill_type
            when "quotation" then "QUOTATION"
            when "order_invoice" then "ORDER INVOICE"
            when "delivery_challan" then "DELIVERY CHALLAN"
            when "order_credit_note" then "CREDIT NOTE"
            end

    pdf.font_size(14) { pdf.text title, style: :bold, align: :center, color: "333333" }
    pdf.move_down 10
  end

  def render_separator(pdf)
    pdf.stroke_horizontal_rule
    pdf.move_down 15
  end

  def render_quotation(pdf)
    order = @record
    party = order.party

    # Quotation info
    pdf.font_size(10) do
      pdf.text_box "Quotation No: #{order.order_number}", at: [0, pdf.cursor], width: 250
      pdf.text_box "Date: #{order.date.strftime('%d-%m-%Y')}", at: [300, pdf.cursor], width: 200, align: :right
    end
    pdf.move_down 15

    if order.valid_until.present?
      pdf.font_size(10) do
        pdf.text_box "Valid Until: #{order.valid_until.strftime('%d-%m-%Y')}", at: [0, pdf.cursor], width: 250
      end
      pdf.move_down 15
    end

    # Bill To
    render_party_info(pdf, "Quotation For:", party, order.city)
    pdf.move_down 15

    # Items table
    render_order_items_table(pdf, order)
    pdf.move_down 10

    # Summary
    render_order_summary(pdf, order)

    # Terms
    pdf.move_down 20
    pdf.font_size(9) do
      pdf.text "Terms & Conditions:", style: :bold
      pdf.text "1. Prices are subject to change without prior notice."
      pdf.text "2. This quotation is valid#{order.valid_until.present? ? " until #{order.valid_until.strftime('%d-%m-%Y')}" : ' for 7 days from the date of issue'}."
      pdf.text "3. Delivery charges will be applied separately per shipment."
    end
  end

  def render_order_invoice(pdf)
    order = @record
    party = order.party

    # Invoice info
    pdf.font_size(10) do
      pdf.text_box "Order No: #{order.order_number}", at: [0, pdf.cursor], width: 250
      pdf.text_box "Date: #{order.date.strftime('%d-%m-%Y')}", at: [300, pdf.cursor], width: 200, align: :right
    end
    pdf.move_down 15

    pdf.font_size(10) do
      pdf.text_box "Status: #{order.status.humanize}", at: [0, pdf.cursor], width: 250
    end
    pdf.move_down 15

    # Bill To
    render_party_info(pdf, "Bill To:", party, order.city)
    pdf.move_down 15

    # Items table with delivery tracking
    items_data = [
      ["#", "Product", "Unit", "Bag Type", "Bags", "Qty", "Rate", "Amount", "Delivered", "Pending"]
    ]

    order.order_items.includes(:product, :unit).each_with_index do |item, idx|
      items_data << [
        (idx + 1).to_s,
        item.product.name,
        item.unit.abbreviation,
        format_bag_type(item.bag_type),
        item.no_of_bags.present? ? format_number(item.no_of_bags) : "-",
        format_number(item.qty),
        format_inr(item.rate),
        format_inr(item.amount),
        format_number(item.delivered_qty),
        format_number(item.pending_qty)
      ]
    end

    pdf.table(items_data, header: true, width: pdf.bounds.width) do |t|
      t.row(0).font_style = :bold
      t.row(0).background_color = "E8E8E8"
      t.columns(0).width = 25
      t.columns(2..9).align = :right
      t.cell_style = { size: 8, padding: [4, 4] }
    end

    pdf.move_down 10

    # Financial summary
    render_order_summary(pdf, order)

    # Delivery summary
    if order.deliveries.any?
      pdf.move_down 15
      pdf.font_size(11) { pdf.text "Deliveries", style: :bold }
      pdf.move_down 5

      delivery_data = [["#", "Delivery No", "Date", "Status", "Transport", "Items"]]
      order.deliveries.includes(delivery_items: :product).each_with_index do |d, idx|
        item_names = d.delivery_items.map { |di|
          bag_info = di.bag_type.present? && di.no_of_bags.present? ? "#{format_number(di.no_of_bags)} x #{di.bag_type.to_i}kg = " : ""
          "#{di.product.name} (#{bag_info}#{format_number(di.qty)})"
        }.join(", ")
        delivery_data << [
          (idx + 1).to_s,
          d.delivery_number,
          d.date.strftime("%d-%m-%Y"),
          d.status.humanize,
          format_inr(d.transport),
          item_names
        ]
      end

      pdf.table(delivery_data, header: true, width: pdf.bounds.width) do |t|
        t.row(0).font_style = :bold
        t.row(0).background_color = "F0F0F0"
        t.columns(0).width = 25
        t.columns(4).align = :right
        t.cell_style = { size: 8, padding: [4, 5] }
      end
    end
  end

  def render_delivery_challan(pdf)
    delivery = @record
    order = delivery.order
    party = order.party

    # Challan info
    pdf.font_size(10) do
      pdf.text_box "Challan No: #{delivery.delivery_number}", at: [0, pdf.cursor], width: 250
      pdf.text_box "Date: #{delivery.date.strftime('%d-%m-%Y')}", at: [300, pdf.cursor], width: 200, align: :right
    end
    pdf.move_down 15

    pdf.font_size(10) do
      pdf.text_box "Order No: #{order.order_number}", at: [0, pdf.cursor], width: 250
    end
    pdf.move_down 15

    # Deliver To
    render_party_info(pdf, "Deliver To:", party, order.city)
    pdf.move_down 15

    # Vehicle info
    if delivery.vehicle_no.present? || delivery.driver_name.present?
      pdf.font_size(10) do
        parts = []
        parts << "Vehicle: #{delivery.vehicle_no}" if delivery.vehicle_no.present?
        parts << "Driver: #{delivery.driver_name}" if delivery.driver_name.present?
        pdf.text parts.join("  |  ")
      end
      pdf.move_down 10
    end

    # Items table
    items_data = [["#", "Product", "Unit", "Bag Type", "Bags", "Qty"]]

    delivery.delivery_items.includes(:product, :unit).each_with_index do |item, idx|
      items_data << [
        (idx + 1).to_s,
        item.product.name,
        item.unit.abbreviation,
        format_bag_type(item.bag_type),
        item.no_of_bags.present? ? format_number(item.no_of_bags) : "-",
        format_number(item.qty)
      ]
    end

    pdf.table(items_data, header: true, width: pdf.bounds.width) do |t|
      t.row(0).font_style = :bold
      t.row(0).background_color = "E8E8E8"
      t.columns(0).width = 30
      t.columns(2..4).align = :right
      t.cell_style = { size: 10, padding: [6, 8] }
    end

    if delivery.transport.to_f > 0
      pdf.move_down 10
      transport_data = [["Transport Charges", format_inr(delivery.transport)]]
      pdf.table(transport_data, position: :right, width: 250) do |t|
        t.columns(1).align = :right
        t.cell_style = { size: 10, padding: [5, 8], font_style: :bold }
      end
    end

    if delivery.remarks.present?
      pdf.move_down 15
      pdf.font_size(10) do
        pdf.text "Remarks: #{delivery.remarks}", color: "666666"
      end
    end

    # Receiver signature area
    pdf.move_down 30
    pdf.font_size(10) do
      pdf.text_box "Received in good condition", at: [0, pdf.cursor], width: 200
      pdf.text_box "Receiver's Signature: _______________", at: [pdf.bounds.width - 250, pdf.cursor], width: 250, align: :right
    end
  end

  def render_order_credit_note(pdf)
    credit_note = @record
    order = credit_note.order
    delivery = credit_note.delivery
    party = order.party

    # Credit note info
    pdf.font_size(10) do
      pdf.text_box "Credit Note No: #{credit_note.credit_note_number}", at: [0, pdf.cursor], width: 250
      pdf.text_box "Date: #{credit_note.date.strftime('%d-%m-%Y')}", at: [300, pdf.cursor], width: 200, align: :right
    end
    pdf.move_down 15

    pdf.font_size(10) do
      pdf.text_box "Order: #{order.order_number}  |  Delivery: #{delivery.delivery_number}", at: [0, pdf.cursor], width: 500
    end
    pdf.move_down 15

    # Party info
    render_party_info(pdf, "Issued To:", party, order.city)
    pdf.move_down 10

    if credit_note.reason.present?
      pdf.font_size(10) do
        pdf.text "Reason: #{credit_note.reason}", style: :bold, color: "CC0000"
      end
      pdf.move_down 10
    end

    # Items table
    items_data = [["#", "Product", "Unit", "Bag Type", "Bags", "Qty", "Rate", "Amount"]]

    credit_note.credit_note_items.includes(:product, :unit, :delivery_item).each_with_index do |item, idx|
      di = item.delivery_item
      items_data << [
        (idx + 1).to_s,
        item.product.name,
        item.unit.abbreviation,
        di&.bag_type.present? ? format_bag_type(di.bag_type) : "-",
        di&.no_of_bags.present? ? format_number((item.qty * 100 / di.bag_type).round(2)) : "-",
        format_number(item.qty),
        format_inr(item.rate),
        format_inr(item.amount)
      ]
    end

    pdf.table(items_data, header: true, width: pdf.bounds.width) do |t|
      t.row(0).font_style = :bold
      t.row(0).background_color = "E8E8E8"
      t.columns(0).width = 25
      t.columns(2..7).align = :right
      t.cell_style = { size: 9, padding: [5, 6] }
    end

    pdf.move_down 10

    total_data = [
      [{ content: "Total Credit Amount", font_style: :bold },
       { content: format_inr(credit_note.total_amount), font_style: :bold }]
    ]

    pdf.table(total_data, position: :right, width: 250) do |t|
      t.columns(1).align = :right
      t.cell_style = { size: 10, padding: [5, 8] }
      t.row(0).background_color = "FFF0F0"
    end

    if credit_note.remarks.present?
      pdf.move_down 15
      pdf.font_size(10) { pdf.text "Remarks: #{credit_note.remarks}", color: "666666" }
    end
  end

  # ── Shared helpers ──────────────────────────────────────

  def render_party_info(pdf, label, party, city = nil)
    pdf.font_size(11) { pdf.text label, style: :bold }
    pdf.font_size(10) do
      pdf.text party.name, style: :bold
      pdf.text city if city.present?
      pdf.text party.village_city if party.village_city.present? && party.village_city != city
      pdf.text "Phone: #{party.phone}" if party.phone.present?
    end
  end

  def render_order_items_table(pdf, order)
    items_data = [["#", "Product", "Unit", "Bag Type", "Bags", "Qty", "Rate", "Amount"]]

    order.order_items.includes(:product, :unit).each_with_index do |item, idx|
      items_data << [
        (idx + 1).to_s,
        item.product.name,
        item.unit.abbreviation,
        format_bag_type(item.bag_type),
        item.no_of_bags.present? ? format_number(item.no_of_bags) : "-",
        format_number(item.qty),
        format_inr(item.rate),
        format_inr(item.amount)
      ]
    end

    pdf.table(items_data, header: true, width: pdf.bounds.width) do |t|
      t.row(0).font_style = :bold
      t.row(0).background_color = "E8E8E8"
      t.columns(0).width = 25
      t.columns(2..7).align = :right
      t.cell_style = { size: 9, padding: [5, 6] }
    end
  end

  def render_order_summary(pdf, order)
    summary_data = []
    summary_data << ["Sub Total", format_inr(order.subtotal)]
    summary_data << ["Discount", "- #{format_inr(order.discount)}"] if order.discount.to_f > 0
    summary_data << [{ content: "Total Amount", font_style: :bold },
                     { content: format_inr(order.total_amount), font_style: :bold }]
    summary_data << ["Received", format_inr(order.received)]
    summary_data << [{ content: "Balance Due", font_style: :bold },
                     { content: format_inr(order.balance), font_style: :bold }]

    pdf.table(summary_data, position: :right, width: 250) do |t|
      t.columns(1).align = :right
      t.cell_style = { size: 10, padding: [5, 8] }
      t.row(-1).background_color = "F5F5F5"
    end
  end

  def render_footer(pdf)
    pdf.move_down 40
    render_separator(pdf)

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
    if integer_part.start_with?("-,")
      integer_part = "-" + integer_part[2..]
    end
    "Rs. #{integer_part}.#{parts[1]}"
  end

  def format_number(num)
    return "0" unless num
    num.to_f == num.to_f.to_i ? num.to_i.to_s : format("%.3f", num)
  end

  def format_bag_type(bag_type)
    return "-" if bag_type.blank? || bag_type.to_f.zero?

    "#{bag_type.to_i} kg"
  end
end
