class OrderEvent < ApplicationRecord
  belongs_to :order
  belongs_to :created_by, class_name: "User", optional: true

  enum :event_type, {
    created: 0,
    quotation_sent: 1,
    confirmed: 2,
    status_change: 3,
    delivery_created: 4,
    delivery_completed: 5,
    credit_note_issued: 6,
    cancelled: 7,
    closed: 8
  }

  validates :event_type, presence: true
  validates :date, presence: true
end
