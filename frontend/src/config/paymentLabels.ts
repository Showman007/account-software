/**
 * Centralized payment direction labels.
 * Change these to update labels across the entire frontend
 * (payments list, party ledger, forms, etc.).
 */

export const PAYMENT_LABELS = {
  payment_to_supplier: {
    label: 'Payment to Supplier',
    reversalLabel: 'Refund to Supplier',
    color: 'error' as const,
    reversalColor: 'warning' as const,
  },
  receipt_from_buyer: {
    label: 'Receipt from Customer',
    reversalLabel: 'Refund to Customer',
    color: 'success' as const,
    reversalColor: 'warning' as const,
  },
} as const;

export type PaymentDirection = keyof typeof PAYMENT_LABELS;

export const directionOptions = [
  { value: 'payment_to_supplier', label: PAYMENT_LABELS.payment_to_supplier.label },
  { value: 'receipt_from_buyer', label: PAYMENT_LABELS.receipt_from_buyer.label },
];

export const getPaymentLabel = (direction: string, isReversal: boolean) => {
  const config = PAYMENT_LABELS[direction as PaymentDirection];
  if (!config) return direction;
  return isReversal ? config.reversalLabel : config.label;
};

export const getPaymentColor = (direction: string, isReversal: boolean) => {
  const config = PAYMENT_LABELS[direction as PaymentDirection];
  if (!config) return 'default' as const;
  return isReversal ? config.reversalColor : config.color;
};
