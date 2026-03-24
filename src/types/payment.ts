export type PaymentStatus = 'successful' | 'failed' | 'processing';
export type PaymentMethod = 'upi' | 'bank' | 'card';
export type TransactionType = 'emi_payment' | 'disbursement' | 'processing_fee' | 'late_fee' | 'prepayment';

export interface Payment {
  id: string;
  transactionId: string;
  loanId: string;
  loanType: string;
  type: TransactionType;
  amount: number;
  date: string;
  status: PaymentStatus;
  method: PaymentMethod;
  methodDetail: string;
}

export interface PaymentMethodInfo {
  id: string;
  type: PaymentMethod;
  name: string;
  detail: string;
  icon: string;
  isDefault: boolean;
}

export interface UpcomingPayment {
  loanId: string;
  loanType: string;
  emiAmount: number;
  dueDate: string;
  isOverdue: boolean;
  daysLeft: number;
}
