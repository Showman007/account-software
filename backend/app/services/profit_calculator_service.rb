class ProfitCalculatorService
  def initialize(from_date: nil, to_date: nil)
    @from_date = from_date
    @to_date = to_date
  end

  def call
    {
      total_revenue: total_revenue,
      total_purchases: total_purchases,
      total_milling_cost: total_milling_cost,
      total_other_expenses: total_other_expenses,
      net_profit: net_profit,
      partner_shares: partner_shares
    }
  end

  private

  def date_scope(scope)
    scope = scope.where('date >= ?', @from_date) if @from_date
    scope = scope.where('date <= ?', @to_date) if @to_date
    scope
  end

  def total_revenue
    @total_revenue ||= date_scope(OutboundEntry.all).sum(:total_bill)
  end

  def total_purchases
    @total_purchases ||= date_scope(InboundEntry.all).sum(:net_amt)
  end

  def total_milling_cost
    @total_milling_cost ||= date_scope(MillingBatch.all).sum(:milling_cost)
  end

  def total_other_expenses
    @total_other_expenses ||= date_scope(Expense.all).sum(:amount)
  end

  def net_profit
    @net_profit ||= total_revenue - total_purchases - total_milling_cost - total_other_expenses
  end

  def partner_shares
    Partner.active.map do |partner|
      share = if partner.percentage?
                net_profit * (partner.profit_share_rate || 0) / 100
              else
                partner.profit_share_rate || 0
              end

      total_paid = CreditTransaction.where(partner_id: partner.id, transaction_type: :profit_share).sum(:profit_paid)

      {
        partner_id: partner.id,
        partner_name: partner.name,
        share_type: partner.profit_share_type,
        share_rate: partner.profit_share_rate,
        calculated_share: share,
        already_paid: total_paid,
        remaining: share - total_paid
      }
    end
  end
end
