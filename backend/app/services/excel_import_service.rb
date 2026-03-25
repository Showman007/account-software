class ExcelImportService
  def initialize(file)
    @file = file
    @errors = []
    @summary = {}
  end

  def call
    spreadsheet = open_spreadsheet

    return { success: false, errors: @errors } unless spreadsheet

    ActiveRecord::Base.transaction do
      spreadsheet.sheets.each do |sheet_name|
        import_sheet(spreadsheet, sheet_name)
      end

      raise ActiveRecord::Rollback if @errors.any?
    end

    if @errors.any?
      { success: false, errors: @errors }
    else
      { success: true, summary: @summary }
    end
  end

  private

  def open_spreadsheet
    case File.extname(@file.original_filename).downcase
    when '.xlsx', '.xls'
      Roo::Spreadsheet.open(@file.path)
    when '.csv'
      Roo::CSV.new(@file.path)
    else
      @errors << 'Unsupported file format. Use .xlsx, .xls, or .csv'
      nil
    end
  rescue StandardError => e
    @errors << "Failed to open file: #{e.message}"
    nil
  end

  def import_sheet(spreadsheet, sheet_name)
    spreadsheet.default_sheet = sheet_name
    headers = spreadsheet.row(1).map { |h| h&.to_s&.strip&.downcase&.gsub(/\s+/, '_') }

    return if headers.compact.empty?

    model_class = detect_model(sheet_name)
    unless model_class
      @summary[sheet_name] = 'Skipped - unknown sheet'
      return
    end

    count = 0
    (2..spreadsheet.last_row).each do |row_num|
      row_data = Hash[headers.zip(spreadsheet.row(row_num))]
      row_data.compact!

      begin
        record = model_class.new(row_data.slice(*model_class.column_names))
        record.save!
        count += 1
      rescue ActiveRecord::RecordInvalid => e
        @errors << "#{sheet_name} row #{row_num}: #{e.message}"
      rescue StandardError => e
        @errors << "#{sheet_name} row #{row_num}: #{e.message}"
      end
    end

    @summary[sheet_name] = "#{count} records imported"
  end

  def detect_model(sheet_name)
    mapping = {
      'parties' => Party,
      'inbound' => InboundEntry,
      'inbound_entries' => InboundEntry,
      'outbound' => OutboundEntry,
      'outbound_entries' => OutboundEntry,
      'milling' => MillingBatch,
      'milling_batches' => MillingBatch,
      'expenses' => Expense,
      'payments' => Payment,
      'partners' => Partner,
      'credit_transactions' => CreditTransaction,
      'products' => Product,
      'units' => Unit
    }

    mapping[sheet_name.downcase.strip]
  end
end
