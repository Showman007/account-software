import apiClient from './client.ts';
import type { PaginatedResponse, QueryParams } from '../types/common.ts';
import type { User } from '../types/auth.ts';
import type { Party, Product, Unit, ExpenseCategory, PaymentMode } from '../types/masters.ts';
import type { InboundEntry, OutboundEntry, Payment } from '../types/transactions.ts';
import type { MillingBatch, Expense, StockItem } from '../types/operations.ts';
import type { Partner, CreditTransaction } from '../types/partners.ts';
import type { JournalEntry, JournalPaginatedResponse, JournalSummary } from '../types/journal.ts';
import type { DashboardData, MasterLedgerData, PartyLedgerData, ProfitCalculatorData, OrdersDashboardData } from '../types/reports.ts';
import type { ResourceApi, QueryResult, TableInfo } from '../types/api.ts';
import type { Order, Delivery, OrderCreditNote } from '../types/orders.ts';

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

// Orders API
export const ordersApi = createResourceApi<Order>('orders');

export async function getOrder(id: number): Promise<{ data: Order }> {
  const response = await apiClient.get(`/orders/${id}`);
  return response.data;
}

export async function confirmOrder(id: number): Promise<{ data: Order }> {
  const response = await apiClient.post(`/orders/${id}/confirm`);
  return response.data;
}

export async function cancelOrder(id: number, reason?: string): Promise<{ data: Order }> {
  const response = await apiClient.post(`/orders/${id}/cancel`, { reason });
  return response.data;
}

export async function closeOrder(id: number): Promise<{ data: Order }> {
  const response = await apiClient.post(`/orders/${id}/close`);
  return response.data;
}

export async function duplicateOrder(id: number): Promise<{ data: Order }> {
  const response = await apiClient.post(`/orders/${id}/duplicate`);
  return response.data;
}

// Deliveries API
export async function getDeliveries(orderId: number, params?: QueryParams): Promise<PaginatedResponse<Delivery>> {
  const response = await apiClient.get(`/orders/${orderId}/deliveries`, { params });
  return response.data;
}

export async function createDelivery(orderId: number, data: Record<string, unknown>): Promise<{ data: Delivery }> {
  const response = await apiClient.post(`/orders/${orderId}/deliveries`, data);
  return response.data;
}

export async function markDeliveryInTransit(orderId: number, deliveryId: number): Promise<{ data: Delivery }> {
  const response = await apiClient.post(`/orders/${orderId}/deliveries/${deliveryId}/mark_in_transit`);
  return response.data;
}

export async function markDeliveryDelivered(orderId: number, deliveryId: number): Promise<{ data: Delivery }> {
  const response = await apiClient.post(`/orders/${orderId}/deliveries/${deliveryId}/mark_delivered`);
  return response.data;
}

// Order Credit Notes API
export async function createOrderCreditNote(
  orderId: number,
  deliveryId: number,
  data: Record<string, unknown>
): Promise<{ data: OrderCreditNote }> {
  const response = await apiClient.post(`/orders/${orderId}/order_credit_notes`, { ...data, delivery_id: deliveryId });
  return response.data;
}

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

export async function fetchOrdersDashboard(params?: { from_date?: string; to_date?: string }): Promise<OrdersDashboardData> {
  const query = new URLSearchParams();
  if (params?.from_date) query.set('from_date', params.from_date);
  if (params?.to_date) query.set('to_date', params.to_date);
  const response = await apiClient.get(`/orders_dashboard?${query}`);
  return response.data.data || response.data;
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

export function getExportUrl(type: string, filterParams?: Record<string, string>): string {
  const base = apiClient.defaults.baseURL || '';
  const params = new URLSearchParams();
  if (filterParams) {
    for (const [key, value] of Object.entries(filterParams)) {
      if (value) params.set(key, value);
    }
  }
  const qs = params.toString();
  return `${base}/exports/${type}${qs ? `?${qs}` : ''}`;
}

// Attachments (Google Drive)
import type { Attachment } from '../types/common.ts';

export type AttachableType = 'outbound_entries' | 'inbound_entries' | 'expenses';

export async function uploadAttachment(
  type: AttachableType,
  id: number,
  file: File
): Promise<{ data: Attachment }> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post(`/${type}/${id}/attachment`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function downloadAttachment(
  type: AttachableType,
  id: number
): Promise<Blob> {
  const response = await apiClient.get(`/${type}/${id}/attachment`, {
    responseType: 'blob',
  });
  return response.data;
}

export async function deleteAttachment(
  type: AttachableType,
  id: number
): Promise<void> {
  await apiClient.delete(`/${type}/${id}/attachment`);
}

// Bill PDF generation
export type BillType = 'customer_invoice' | 'credit_note' | 'payment_receipt' | 'refund_receipt'
  | 'quotation' | 'order_invoice' | 'delivery_challan' | 'order_credit_note';

export function getBillUrl(billType: BillType, id: number): string {
  const base = apiClient.defaults.baseURL || '';
  return `${base}/bills/${billType}/${id}`;
}

export async function downloadBillPdf(billType: BillType, id: number): Promise<Blob> {
  const response = await apiClient.get(`/bills/${billType}/${id}`, {
    responseType: 'blob',
  });
  return response.data;
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
