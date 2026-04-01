class OrdersDashboardService
  def initialize(from_date: nil, to_date: nil)
    @from_date = from_date
    @to_date = to_date
  end

  def call
    {
      summary_cards: summary_cards,
      attention: attention,
      order_pipeline: order_pipeline,
      delivery_trend: delivery_trend,
      top_parties: top_parties,
      product_summary: product_summary,
      recent_activity: recent_activity
    }
  end

  private

  # ---------- scoped queries ----------

  def scoped_orders
    scope = Order.all
    scope = scope.where("orders.date >= ?", @from_date) if @from_date
    scope = scope.where("orders.date <= ?", @to_date) if @to_date
    scope
  end

  def non_cancelled_orders
    scoped_orders.where.not(status: :cancelled)
  end

  # Active = not cancelled, closed, or delivered
  ACTIVE_STATUSES = %i[quotation confirmed processing shipped partial_delivered].freeze

  def active_orders
    scoped_orders.where(status: ACTIVE_STATUSES)
  end

  # ---------- summary cards ----------

  def summary_cards
    {
      total_order_value: non_cancelled_orders.sum(:total_amount),
      total_delivered_value: total_delivered_value,
      pending_delivery_value: pending_delivery_value,
      outstanding_balance: outstanding_balance
    }
  end

  def total_delivered_value
    OrderItem.joins(:order)
             .merge(non_cancelled_orders)
             .sum("order_items.delivered_qty * order_items.rate")
  end

  def pending_delivery_value
    OrderItem.joins(:order)
             .merge(active_orders)
             .sum("order_items.pending_qty * order_items.rate")
  end

  def outstanding_balance
    non_cancelled_orders
      .where.not(status: :closed)
      .where("orders.balance > 0")
      .sum(:balance)
  end

  # ---------- attention ----------

  def attention
    {
      expired_quotations_count: expired_quotations_count,
      in_transit_count: in_transit_count,
      stale_orders_count: stale_orders_count,
      credit_notes_count: credit_notes_this_month.count,
      credit_notes_amount: credit_notes_this_month.sum(:total_amount)
    }
  end

  def expired_quotations_count
    Order.where(status: :quotation)
         .where("valid_until < ?", Date.current)
         .count
  end

  def in_transit_count
    Delivery.where(status: :in_transit).count
  end

  def stale_orders_count
    stale_cutoff = 7.days.ago.to_date
    orders_with_recent_delivery = Delivery.where("deliveries.created_at >= ?", stale_cutoff)
                                          .select(:order_id)
    Order.where(status: %i[confirmed processing])
         .where.not(id: orders_with_recent_delivery)
         .count
  end

  def credit_notes_this_month
    @credit_notes_this_month ||= OrderCreditNote.where(
      date: Date.current.beginning_of_month..Date.current.end_of_month
    )
  end

  # ---------- order pipeline ----------

  def order_pipeline
    non_cancelled_orders.group(:status).count.transform_keys { |k| k.to_s }
  end

  # ---------- delivery trend (weekly buckets) ----------

  def delivery_trend
    range = delivery_trend_range
    start_date = range.first.beginning_of_week(:monday)
    end_date = range.last.end_of_week(:monday)

    # Orders per week
    orders_by_week = Order.where(date: start_date..end_date)
                          .where.not(status: :cancelled)
                          .group("DATE_TRUNC('week', orders.date)")
                          .select(
                            "DATE_TRUNC('week', orders.date) AS week_start",
                            "COUNT(*) AS orders_count",
                            "COALESCE(SUM(orders.total_amount), 0) AS orders_value"
                          )
                          .index_by { |r| r.week_start.to_date }

    # Delivered qty per week (from deliveries marked delivered)
    delivered_by_week = DeliveryItem.joins(:delivery)
                                    .where(deliveries: { status: :delivered, date: start_date..end_date })
                                    .group("DATE_TRUNC('week', deliveries.date)")
                                    .sum(:qty)
                                    .transform_keys { |k| k.to_date }

    weeks = []
    current = start_date
    while current <= end_date
      order_row = orders_by_week[current]
      weeks << {
        period: current.iso8601,
        orders_count: order_row&.orders_count || 0,
        orders_value: order_row&.orders_value || 0,
        delivered_qty: delivered_by_week[current] || 0
      }
      current += 7.days
    end
    weeks
  end

  def delivery_trend_range
    if @from_date && @to_date
      Date.parse(@from_date.to_s)..Date.parse(@to_date.to_s)
    else
      12.weeks.ago.to_date..Date.current
    end
  end

  # ---------- top parties ----------

  def top_parties
    Order.where.not(status: %i[cancelled closed])
         .where("orders.balance > 0")
         .joins(:party)
         .group("parties.id", "parties.name", "parties.village_city")
         .select(
           "parties.id AS party_id",
           "parties.name AS party_name",
           "parties.village_city AS city",
           "COALESCE(SUM(orders.total_amount), 0) AS order_value",
           "COALESCE(SUM(orders.received), 0) AS received",
           "COALESCE(SUM(orders.balance), 0) AS outstanding"
         )
         .order("outstanding DESC")
         .limit(10)
         .map do |row|
      delivered_val = OrderItem.joins(:order)
                               .where(orders: { party_id: row.party_id })
                               .merge(Order.where.not(status: :cancelled))
                               .sum("order_items.delivered_qty * order_items.rate")
      {
        party_id: row.party_id,
        party_name: row.party_name,
        city: row.city,
        order_value: row.order_value,
        delivered_value: delivered_val,
        received: row.received,
        outstanding: row.outstanding
      }
    end
  end

  # ---------- product summary ----------

  def product_summary
    OrderItem.joins(:order, :product)
             .merge(non_cancelled_orders)
             .group("products.name")
             .select(
               "products.name AS product_name",
               "COALESCE(SUM(order_items.qty), 0) AS ordered_qty",
               "COALESCE(SUM(order_items.delivered_qty), 0) AS delivered_qty",
               "COALESCE(SUM(order_items.returned_qty), 0) AS returned_qty",
               "COALESCE(SUM(order_items.pending_qty), 0) AS pending_qty"
             )
             .order("ordered_qty DESC")
             .map do |row|
      fulfillment = if row.ordered_qty.to_d.positive?
                      (row.delivered_qty.to_d / row.ordered_qty.to_d * 100).round(1)
                    else
                      0.0
                    end
      {
        product_name: row.product_name,
        ordered_qty: row.ordered_qty,
        delivered_qty: row.delivered_qty,
        returned_qty: row.returned_qty,
        pending_qty: row.pending_qty,
        fulfillment_pct: fulfillment
      }
    end
  end

  # ---------- recent activity ----------

  def recent_activity
    OrderEvent.joins(:order)
              .order(created_at: :desc)
              .limit(15)
              .select(
                "order_events.id",
                "order_events.order_id",
                "orders.order_number",
                "order_events.event_type",
                "order_events.date",
                "order_events.status_from",
                "order_events.status_to",
                "order_events.remarks",
                "order_events.created_at"
              )
              .map do |e|
      {
        id: e.id,
        order_id: e.order_id,
        order_number: e.order_number,
        event_type: e.event_type,
        date: e.date,
        status_from: e.status_from,
        status_to: e.status_to,
        remarks: e.remarks,
        created_at: e.created_at
      }
    end
  end
end
