class PaymentWithAllocationsSerializer < Blueprinter::Base
  identifier :id

  fields :date, :party_id, :village_city, :direction, :amount,
         :payment_mode_id, :reference, :remarks, :reversed,
         :reversed_payment_id, :created_at, :updated_at

  association :party, blueprint: PartySerializer
  association :payment_mode, blueprint: PaymentModeSerializer

  field :allocations do |payment|
    payment.payment_allocations.map do |alloc|
      bill = alloc.allocatable
      base = {
        id: alloc.id,
        amount: alloc.amount,
        bill_type: alloc.allocatable_type,
        bill_id: alloc.allocatable_id,
      }

      case alloc.allocatable_type
      when 'OutboundEntry'
        base.merge(
          bill_date: bill.date,
          product_name: bill.product&.name,
          bill_total: bill.total_bill,
          order_id: bill.order_id,
          order_number: bill.order&.order_number,
          delivery_number: bill.delivery_item&.delivery&.delivery_number
        )
      when 'InboundEntry'
        base.merge(
          bill_date: bill.date,
          product_name: bill.product&.name,
          bill_total: bill.net_amt
        )
      else
        base
      end
    end
  end
end
