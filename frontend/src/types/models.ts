export interface User {
  id: number;
  email: string;
  role: string;
  created_at?: string;
}

export interface Party {
  id: number;
  name: string;
  village_city: string;
  phone: string;
  opening_balance: number;
  party_type: 'supplier' | 'buyer' | 'both';
  account_no: string;
  bank: string;
  notes: string;
}

export interface InboundEntry {
  id: number;
  date: string;
  party_id: number;
  village: string;
  product_id: number;
  category: string;
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
}

export interface OutboundEntry {
  id: number;
  date: string;
  party_id: number;
  city: string;
  product_id: number;
  category: string;
  qty: number;
  unit_id: number;
  rate: number;
  amount: number;
  transport: number;
  total_bill: number;
  received: number;
  balance: number;
}

export interface MillingBatch {
  id: number;
  date: string;
  paddy_type: string;
  miller_name: string;
  input_qty: number;
  milling_cost: number;
  rice_main_qty: number;
  broken_rice_qty: number;
  rice_bran_qty: number;
  husk_qty: number;
  rice_flour_qty: number;
  total_output: number;
  loss_diff: number;
}

export interface Expense {
  id: number;
  date: string;
  description: string;
  category_id: number;
  paid_to: string;
  amount: number;
  payment_mode_id: number;
  remarks: string;
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
}

export interface Partner {
  id: number;
  name: string;
  phone: string;
  date_joined: string;
  profit_share_type: 'percentage' | 'fixed';
  profit_share_rate: number;
  status: 'active' | 'inactive';
}

export interface CreditTransaction {
  id: number;
  date: string;
  partner_id: number;
  transaction_type: 'credit_received' | 'principal_return' | 'profit_share';
  credit_received: number;
  principal_returned: number;
  profit_paid: number;
  payment_mode_id: number;
  running_balance: number;
  used_for: string;
  remarks: string;
}

export interface StockItem {
  id: number;
  product_id: number;
  category: string;
  unit_id: number;
  opening_stock: number;
  total_inbound: number;
  from_milling: number;
  total_outbound: number;
  current_stock: number;
  min_level: number;
  status: 'in_stock' | 'low' | 'out_of_stock';
}

export interface Product {
  id: number;
  name: string;
  category: string;
  direction: string;
  default_unit_id: number;
}

export interface Unit {
  id: number;
  name: string;
  abbreviation: string;
}

export interface ExpenseCategory {
  id: number;
  name: string;
}

export interface PaymentMode {
  id: number;
  name: string;
}

export interface PaginationMeta {
  current_page: number;
  total_pages: number;
  total_count: number;
  per_page: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

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

export interface JournalLine {
  id: number;
  account_name: string;
  account_type: 'asset' | 'liability' | 'income' | 'expense' | 'equity';
  debit: number;
  credit: number;
  party_id: number | null;
  partner_id: number | null;
}

export interface JournalEntry {
  id: number;
  entry_number: string;
  date: string;
  narration: string;
  entry_type: string;
  source_type: string | null;
  source_id: number | null;
  total_amount: number;
  reversed_entry_id: number | null;
  created_at: string;
  journal_lines: JournalLine[];
}

export interface JournalSummary {
  total_entries: number;
  total_debit: number;
  total_credit: number;
  by_type: Record<string, number>;
}

export interface JournalPaginatedResponse {
  data: JournalEntry[];
  meta: PaginationMeta;
  summary: JournalSummary;
}

export interface QueryParams {
  page?: number;
  per_page?: number;
  q?: string;
  sort?: string;
  order?: string;
  from_date?: string;
  to_date?: string;
  [key: string]: string | number | undefined;
}
