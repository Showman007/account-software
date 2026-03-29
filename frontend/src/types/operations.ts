/** Operations types — Milling, Expenses, Stock */

import type { Attachment } from './common.ts';

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
  attachment: Attachment | null;
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
