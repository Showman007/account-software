class DashboardService
  def initialize(from_date: nil, to_date: nil)
    @from_date = from_date
    @to_date = to_date
  end

  def call
    {
      total_purchased: total_purchased,
      total_sold: total_sold,
      total_expenses: total_expenses,
      milling_batches_count: milling_batches_count,
      net_profit: total_sold - total_purchased - total_expenses,
      milling_summary: milling_summary,
      partners_overview: partners_overview
    }
  end

  private

  def scoped_inbound
    scope = InboundEntry.all
    scope = scope.where('date >= ?', @from_date) if @from_date
    scope = scope.where('date <= ?', @to_date) if @to_date
    scope
  end

  def scoped_outbound
    scope = OutboundEntry.all
    scope = scope.where('date >= ?', @from_date) if @from_date
    scope = scope.where('date <= ?', @to_date) if @to_date
    scope
  end

  def scoped_expenses
    scope = Expense.all
    scope = scope.where('date >= ?', @from_date) if @from_date
    scope = scope.where('date <= ?', @to_date) if @to_date
    scope
  end

  def scoped_milling
    scope = MillingBatch.all
    scope = scope.where('date >= ?', @from_date) if @from_date
    scope = scope.where('date <= ?', @to_date) if @to_date
    scope
  end

  def total_purchased
    @total_purchased ||= scoped_inbound.sum(:net_amt)
  end

  def total_sold
    @total_sold ||= scoped_outbound.sum(:total_bill)
  end

  def total_expenses
    @total_expenses ||= scoped_expenses.sum(:amount)
  end

  def milling_batches_count
    scoped_milling.count
  end

  def milling_summary
    {
      total_input: scoped_milling.sum(:input_qty),
      total_output: scoped_milling.sum(:total_output),
      total_milling_cost: scoped_milling.sum(:milling_cost),
      total_loss: scoped_milling.sum(:loss_diff)
    }
  end

  def partners_overview
    CreditTransaction.group(:partner_id).select(
      'partner_id',
      'SUM(credit_received) as total_credit',
      'SUM(principal_returned) as total_returned',
      'SUM(profit_paid) as total_profit_paid'
    ).map do |ct|
      partner = Partner.find_by(id: ct.partner_id)
      {
        partner_id: ct.partner_id,
        partner_name: partner&.name,
        total_credit: ct.total_credit,
        total_returned: ct.total_returned,
        total_profit_paid: ct.total_profit_paid,
        outstanding: ct.total_credit - ct.total_returned
      }
    end
  end
end
