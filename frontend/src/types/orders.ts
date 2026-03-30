/** Order & Delivery module types */

import type { Party } from './masters.ts';

export type OrderStatus =
  | 'quotation'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'partial_delivered'
  | 'delivered'
  | 'closed'
  | 'cancelled';

export type DeliveryStatus = 'pending' | 'in_transit' | 'delivered';

export type OrderEventType =
  | 'created'
  | 'quotation_sent'
  | 'confirmed'
  | 'status_change'
  | 'delivery_created'
  | 'delivery_completed'
  | 'credit_note_issued'
  | 'cancelled'
  | 'closed';

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  category: string;
  bag_type: number | null;
  no_of_bags: number | null;
  qty: number;
  unit_id: number;
  rate: number;
  amount: number;
  delivered_qty: number;
  returned_qty: number;
  pending_qty: number;
  product?: { id: number; name: string };
  unit?: { id: number; name: string; abbreviation: string };
}

export interface OrderEvent {
  id: number;
  order_id: number;
  event_type: OrderEventType;
  date: string;
  status_from: string | null;
  status_to: string | null;
  remarks: string | null;
  created_by_id: number | null;
  created_at: string;
}

export interface DeliveryItem {
  id: number;
  delivery_id: number;
  order_item_id: number;
  product_id: number;
  bag_type: number | null;
  no_of_bags: number | null;
  qty: number;
  unit_id: number;
  product?: { id: number; name: string };
  unit?: { id: number; name: string; abbreviation: string };
}

export interface Delivery {
  id: number;
  order_id: number;
  delivery_number: string;
  date: string;
  status: DeliveryStatus;
  transport: number;
  vehicle_no: string | null;
  driver_name: string | null;
  remarks: string | null;
  delivery_items: DeliveryItem[];
}

export interface CreditNoteItem {
  id: number;
  order_credit_note_id: number;
  delivery_item_id: number;
  product_id: number;
  qty: number;
  unit_id: number;
  rate: number;
  amount: number;
  product?: { id: number; name: string };
  unit?: { id: number; name: string; abbreviation: string };
}

export interface OrderCreditNote {
  id: number;
  order_id: number;
  delivery_id: number;
  credit_note_number: string;
  date: string;
  reason: string | null;
  total_amount: number;
  remarks: string | null;
  credit_note_items: CreditNoteItem[];
}

export interface Order {
  id: number;
  order_number: string;
  date: string;
  party_id: number;
  city: string;
  status: OrderStatus;
  subtotal: number;
  discount: number;
  total_amount: number;
  received: number;
  balance: number;
  valid_until: string | null;
  rejection_reason: string | null;
  remarks: string | null;
  created_at: string;
  updated_at: string;
  party?: Party;
  order_items: OrderItem[];
  order_events?: OrderEvent[];
  deliveries?: Delivery[];
  order_credit_notes?: OrderCreditNote[];
}

export interface OrderItemFormData {
  product_id: number | '';
  category: string;
  bag_type: number | '';
  no_of_bags: number | '';
  qty: number | '';
  unit_id: number | '';
  rate: number | '';
  _destroy?: boolean;
}

export interface OrderFormData {
  date: string;
  party_id: number | null;
  city: string;
  discount: number;
  valid_until: string;
  remarks: string;
  order_items_attributes: OrderItemFormData[];
}
