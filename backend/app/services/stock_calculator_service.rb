class StockCalculatorService
  def initialize
  end

  def recalculate_all
    Product.find_each do |product|
      recalculate_for_product(product)
    end
  end

  def recalculate_for_product(product)
    stock_item = StockItem.find_or_initialize_by(product_id: product.id)

    # Set unit from product default or first available
    stock_item.unit_id ||= product.default_unit_id || Unit.first&.id

    stock_item.total_inbound = InboundEntry.where(product_id: product.id).sum(:qty)
    stock_item.total_outbound = OutboundEntry.where(product_id: product.id).sum(:qty)

    # From milling: rice products produced
    stock_item.from_milling = calculate_milling_output(product)

    stock_item.category = product.category
    stock_item.save!
  end

  private

  def calculate_milling_output(product)
    name = product.name.downcase
    column = milling_column_for(name)
    return 0 unless column

    MillingBatch.sum(column)
  end

  def milling_column_for(name)
    case name
    when /broken.*rice/
      :broken_rice_qty
    when /rice.*bran/, /bran/
      :rice_bran_qty
    when /husk/
      :husk_qty
    when /rice.*flour/, /flour/
      :rice_flour_qty
    when /rice/
      :rice_main_qty
    else
      nil
    end
  end
end
