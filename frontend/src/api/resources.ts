import apiClient from './client.ts';
import type { PaginatedResponse, QueryParams } from '../types/common.ts';
import type { User } from '../types/auth.ts';
import type { Party, Product, Unit, ExpenseCategory, PaymentMode } from '../types/masters.ts';
import type { InboundEntry, OutboundEntry, Payment } from '../types/transactions.ts';
import type { MillingBatch, Expense, StockItem } from '../types/operations.ts';
import type { Partner, CreditTransaction } from '../types/partners.ts';
import type { JournalEntry, JournalPaginatedResponse, JournalSummary } from '../types/journal.ts';
import type { DashboardData, MasterLedgerData, PartyLedgerData, ProfitCalculatorData } from '../types/reports.ts';
import type { ResourceApi, QueryResult, TableInfo } from '../types/api.ts';

export type { ResourceApi, QueryResult, TableInfo };

function createResourceApi<T>(resourcePath: string): ResourceApi<T> {
  return {
    async getAll(params?: QueryParams): Promise<PaginatedResponse<T>> {
      const response = await apiClient.get(`/${resourcePath}`, { params });
      return response.data;
    },
    async getOne(id: number): Promise<T> {
      const response = await apiClient.get(`/${resourcePath}/${id}`);
      return response.data;
    },
    async create(data: Partial<T>): Promise<T> {
      const response = await apiClient.post(`/${resourcePath}`, data);
      return response.data;
    },
    async update(id: number, data: Partial<T>): Promise<T> {
      const response = await apiClient.put(`/${resourcePath}/${id}`, data);
      return response.data;
    },
    async remove(id: number): Promise<void> {
      await apiClient.delete(`/${resourcePath}/${id}`);
    },
  };
}

export const partiesApi = createResourceApi<Party>('parties');
export const inboundEntriesApi = createResourceApi<InboundEntry>('inbound_entries');
export const outboundEntriesApi = createResourceApi<OutboundEntry>('outbound_entries');
export const millingBatchesApi = createResourceApi<MillingBatch>('milling_batches');
export const expensesApi = createResourceApi<Expense>('expenses');
export const paymentsApi = createResourceApi<Payment>('payments');

export async function reversePayment(id: number): Promise<{ data: Payment; message: string }> {
  const response = await apiClient.post(`/payments/${id}/reverse`);
  return response.data;
}
export const partnersApi = createResourceApi<Partner>('partners');
export const creditTransactionsApi = createResourceApi<CreditTransaction>('credit_transactions');
export const stockItemsApi = createResourceApi<StockItem>('stock_items');
export const productsApi = createResourceApi<Product>('products');
export const unitsApi = createResourceApi<Unit>('units');
export const expenseCategoriesApi = createResourceApi<ExpenseCategory>('expense_categories');
export const paymentModesApi = createResourceApi<PaymentMode>('payment_modes');
export const usersApi = createResourceApi<User>('users');
export const journalEntriesApi = createResourceApi<JournalEntry>('journal_entries');

export async function fetchJournalEntries(params?: QueryParams): Promise<JournalPaginatedResponse> {
  const response = await apiClient.get('/journal_entries', { params });
  return response.data;
}

export async function fetchAllJournalEntries(params?: QueryParams): Promise<{ data: JournalEntry[]; summary: JournalSummary }> {
  const response = await apiClient.get('/journal_entries', { params: { ...params, all: 'true' } });
  return response.data;
}

export async function backfillJournals(): Promise<{ message: string; count: number }> {
  const response = await apiClient.post('/journal_entries/backfill');
  return response.data;
}

export async function fetchDashboard(): Promise<DashboardData> {
  const response = await apiClient.get('/dashboard');
  return response.data.data || response.data;
}

export async function fetchMasterLedger(): Promise<MasterLedgerData> {
  const response = await apiClient.get('/master_ledger');
  return response.data.data || response.data;
}

export async function fetchPartyLedger(partyId: number): Promise<PartyLedgerData> {
  const response = await apiClient.get(`/party_ledger/${partyId}`);
  return response.data.data || response.data;
}

export async function fetchProfitCalculator(): Promise<ProfitCalculatorData> {
  const response = await apiClient.get('/profit_calculator');
  return response.data;
}

export async function recalculateStock(): Promise<void> {
  await apiClient.post('/stock_items/recalculate');
}

export async function importExcel(file: File): Promise<{ message: string; data: Record<string, string> }> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post('/imports', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export function getExportUrl(type: string, fromDate?: string, toDate?: string): string {
  const base = apiClient.defaults.baseURL || '';
  const params = new URLSearchParams();
  if (fromDate) params.set('from_date', fromDate);
  if (toDate) params.set('to_date', toDate);
  const qs = params.toString();
  return `${base}/exports/${type}${qs ? `?${qs}` : ''}`;
}

// Query Runner
export async function executeQuery(sql: string): Promise<QueryResult> {
  const response = await apiClient.post('/query_runner', { sql });
  return response.data;
}

export async function fetchTables(): Promise<TableInfo[]> {
  const response = await apiClient.get('/query_runner/tables');
  return response.data.tables;
}
