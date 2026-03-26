/** Partners & Credit Transaction types */

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
