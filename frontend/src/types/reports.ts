/** Report types — Dashboard, Ledger, Profit Calculator */

import type { Party } from './masters.ts';

export interface DashboardData {
  total_purchased: number;
  total_sold: number;
  total_expenses: number;
  milling_batches_count: number;
  net_profit: number;
  milling_summary: Record<string, unknown>;
  partners_overview: Record<string, unknown>;
}

export interface LedgerEntry {
  id: number;
  party_name: string;
  village_city: string;
  balance: number;
  [key: string]: unknown;
}

export interface MasterLedgerData {
  buyers_who_owe_us: LedgerEntry[];
  suppliers_we_owe: LedgerEntry[];
}

export interface PartyLedgerData {
  party: Party;
  summary: Record<string, unknown>;
  transactions: Record<string, unknown>[];
}

export interface ProfitCalculatorData {
  total_revenue: number;
  total_purchases: number;
  total_milling_cost: number;
  total_other_expenses: number;
  net_profit: number;
  partner_shares: Record<string, unknown>[];
}

export interface OrdersDashboardData {
  summary_cards: {
    total_order_value: number;
    total_delivered_value: number;
    pending_delivery_value: number;
    outstanding_balance: number;
  };
  attention: {
    expired_quotations_count: number;
    in_transit_count: number;
    stale_orders_count: number;
    credit_notes_count: number;
    credit_notes_amount: number;
  };
  order_pipeline: Record<string, number>;
  delivery_trend: Array<{ period: string; orders_count: number; orders_value: number; delivered_qty: number }>;
  top_parties: Array<{ party_id: number; party_name: string; city: string; order_value: number; delivered_value: number; received: number; outstanding: number }>;
  product_summary: Array<{ product_name: string; ordered_qty: number; delivered_qty: number; returned_qty: number; pending_qty: number; fulfillment_pct: number }>;
  recent_activity: Array<{ id: number; order_id: number; order_number: string; event_type: string; date: string; status_from: string | null; status_to: string | null; remarks: string | null; created_at: string }>;
}
