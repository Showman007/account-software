class Order < ApplicationRecord
  belongs_to :party

  has_many :order_items, dependent: :destroy
  has_many :order_events, dependent: :destroy
  has_many :deliveries, dependent: :destroy
  has_many :order_credit_notes, dependent: :destroy
  has_many :outbound_entries
  has_many :products, through: :order_items

  accepts_nested_attributes_for :order_items, allow_destroy: true

  enum :status, {
    quotation: 0,
    confirmed: 1,
    processing: 2,
    shipped: 3,
    partial_delivered: 4,
    delivered: 5,
    closed: 6,
    cancelled: 7
  }

  validates :date, presence: true
  validates :order_number, presence: true, uniqueness: true
  validates :status, presence: true
  validates :valid_until, comparison: { greater_than_or_equal_to: :date }, allow_nil: true

  before_validation :generate_order_number, on: :create
  before_validation :calculate_totals

  # Only allow editing items/rates while in quotation status
  def editable?
    quotation?
  end

  # Can create deliveries only after confirmation
  def deliverable?
    confirmed? || processing? || shipped? || partial_delivered?
  end

  # Can be cancelled from quotation or confirmed
  def cancellable?
    quotation? || confirmed?
  end

  # Check if quotation has expired
  def expired?
    quotation? && valid_until.present? && valid_until < Date.current
  end

  # Recalculate status based on delivery state
  def recalculate_status!
    return if cancelled? || closed?

    total_ordered = order_items.sum(:qty)
    total_delivered = order_items.sum(:delivered_qty)
    total_returned = order_items.sum(:returned_qty)
    net_delivered = total_delivered - total_returned

    new_status = if net_delivered <= 0
                   status # keep current if nothing delivered yet
                 elsif net_delivered < total_ordered
                   "partial_delivered"
                 else
                   "delivered"
                 end

    if status != new_status
      old_status = status
      update!(status: new_status)
      record_event!(:status_change, status_from: old_status, status_to: new_status)
    end
  end

  # Recalculate financial totals from outbound entries
  def recalculate_financials!
    entries = outbound_entries.reload
    self.received = entries.sum(:received)
    self.balance = total_amount - received
    save!
  end

  def record_event!(event_type, status_from: nil, status_to: nil, remarks: nil, user: nil)
    order_events.create!(
      event_type: event_type,
      date: Date.current,
      status_from: status_from,
      status_to: status_to,
      remarks: remarks,
      created_by: user
    )
  end

  private

  def generate_order_number
    return if order_number.present?

    last = Order.order(id: :desc).pick(:order_number)
    seq = last ? last.scan(/\d+$/).first.to_i + 1 : 1
    self.order_number = "ORD-#{seq.to_s.rjust(5, '0')}"
  end

  def calculate_totals
    return unless order_items.any?

    self.subtotal = order_items.reject(&:marked_for_destruction?).sum { |item| item.qty.to_d * item.rate.to_d }
    self.total_amount = subtotal - (discount || 0)
    self.balance = total_amount - (received || 0)
  end
end
