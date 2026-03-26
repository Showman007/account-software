# Centralized payment direction labels.
# Change these to update labels across the entire app
# (journal entries, party ledger, API responses).

PAYMENT_LABELS = {
  payment_to_supplier: {
    label: 'Payment to Supplier',
    reversal_label: 'Refund to Supplier'
  },
  receipt_from_buyer: {
    label: 'Receipt from Customer',
    reversal_label: 'Refund to Customer'
  }
}.freeze
