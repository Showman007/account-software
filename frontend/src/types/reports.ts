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
