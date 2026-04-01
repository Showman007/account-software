/** Transaction types — Inbound, Outbound, Payments */

import type { Attachment } from './common.ts';

export interface PaymentAllocation {
  id: number;
  payment_id: number;
  allocatable_type: string;
  allocatable_id: number;
  amount: number;
  payment?: Payment;
}

export interface InboundEntry {
  id: number;
  date: string;
  party_id: number;
  village: string;
  product_id: number;
  category: string;
  bag_type: number | null;
  no_of_bags: number | null;
  qty: number;
  unit_id: number;
  rate: number;
  gross_amt: number;
  moisture_pct: number;
  deduction_amt: number;
  net_qty: number;
  net_amt: number;
  paid: number;
  balance: number;
  attachment: Attachment | null;
  payment_allocations?: PaymentAllocation[];
}

export interface OutboundEntry {
  id: number;
  date: string;
  party_id: number;
  city: string;
  product_id: number;
  category: string;
  bag_type: number | null;
  no_of_bags: number | null;
  qty: number;
  unit_id: number;
  rate: number;
  amount: number;
  transport: number;
  total_bill: number;
  received: number;
  balance: number;
  attachment: Attachment | null;
  order_id: number | null;
  delivery_item_id: number | null;
  order_number: string | null;
  delivery_number: string | null;
  payment_allocations?: PaymentAllocation[];
}

export interface Payment {
  id: number;
  date: string;
  party_id: number;
  village_city: string;
  direction: 'payment_to_supplier' | 'receipt_from_buyer';
  amount: number;
  payment_mode_id: number;
  reference: string;
  remarks: string;
  reversed: boolean;
  reversed_payment_id: number | null;
  payment_mode?: { id: number; name: string };
}
