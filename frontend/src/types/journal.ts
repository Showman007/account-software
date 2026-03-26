/** Journal Entry types */

import type { PaginationMeta } from './common.ts';

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
