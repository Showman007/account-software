/** Master Data types — Parties, Products, Units, Expense Categories, Payment Modes */

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
