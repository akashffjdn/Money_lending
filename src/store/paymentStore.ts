import { create } from 'zustand';
import type {
  Payment,
  PaymentMethodInfo,
  UpcomingPayment,
} from '../types/payment';

const mockPayments: Payment[] = [
  // January 2026
  {
    id: 'PAY001',
    transactionId: 'TXN20260105001',
    loanId: 'LE-2026-45821',
    loanType: 'Personal Loan',
    type: 'emi_payment',
    amount: 12500,
    date: '2026-01-05',
    status: 'successful',
    method: 'upi',
    methodDetail: 'PhonePe',
  },
  {
    id: 'PAY002',
    transactionId: 'TXN20260110001',
    loanId: 'LE-2026-38947',
    loanType: 'Business Loan',
    type: 'emi_payment',
    amount: 17580,
    date: '2026-01-10',
    status: 'successful',
    method: 'bank',
    methodDetail: 'SBI XXXX1234',
  },
  {
    id: 'PAY003',
    transactionId: 'TXN20260115001',
    loanId: 'LE-2026-72310',
    loanType: 'Education Loan',
    type: 'emi_payment',
    amount: 13330,
    date: '2026-01-15',
    status: 'successful',
    method: 'bank',
    methodDetail: 'SBI XXXX1234',
  },
  {
    id: 'PAY004',
    transactionId: 'TXN20260115002',
    loanId: 'LE-2026-91205',
    loanType: 'Vehicle Loan',
    type: 'disbursement',
    amount: 300000,
    date: '2026-01-15',
    status: 'successful',
    method: 'bank',
    methodDetail: 'Axis XXXX3456',
  },
  {
    id: 'PAY005',
    transactionId: 'TXN20260115003',
    loanId: 'LE-2026-91205',
    loanType: 'Vehicle Loan',
    type: 'processing_fee',
    amount: 3000,
    date: '2026-01-15',
    status: 'successful',
    method: 'upi',
    methodDetail: 'PhonePe',
  },
  {
    id: 'PAY006',
    transactionId: 'TXN20260120001',
    loanId: 'LE-2026-91205',
    loanType: 'Vehicle Loan',
    type: 'emi_payment',
    amount: 10400,
    date: '2026-01-20',
    status: 'successful',
    method: 'card',
    methodDetail: 'HDFC XXXX5678',
  },
  // February 2026
  {
    id: 'PAY007',
    transactionId: 'TXN20260205001',
    loanId: 'LE-2026-45821',
    loanType: 'Personal Loan',
    type: 'emi_payment',
    amount: 12500,
    date: '2026-02-05',
    status: 'successful',
    method: 'upi',
    methodDetail: 'PhonePe',
  },
  {
    id: 'PAY008',
    transactionId: 'TXN20260210001',
    loanId: 'LE-2026-38947',
    loanType: 'Business Loan',
    type: 'emi_payment',
    amount: 17580,
    date: '2026-02-10',
    status: 'successful',
    method: 'bank',
    methodDetail: 'SBI XXXX1234',
  },
  {
    id: 'PAY009',
    transactionId: 'TXN20260215001',
    loanId: 'LE-2026-91205',
    loanType: 'Vehicle Loan',
    type: 'emi_payment',
    amount: 10400,
    date: '2026-02-15',
    status: 'successful',
    method: 'upi',
    methodDetail: 'PhonePe',
  },
  {
    id: 'PAY010',
    transactionId: 'TXN20260218001',
    loanId: 'LE-2026-15634',
    loanType: 'Medical Loan',
    type: 'processing_fee',
    amount: 750,
    date: '2026-02-18',
    status: 'successful',
    method: 'upi',
    methodDetail: 'PhonePe',
  },
  // March 2026
  {
    id: 'PAY011',
    transactionId: 'TXN20260305001',
    loanId: 'LE-2026-45821',
    loanType: 'Personal Loan',
    type: 'emi_payment',
    amount: 12500,
    date: '2026-03-05',
    status: 'successful',
    method: 'upi',
    methodDetail: 'PhonePe',
  },
  {
    id: 'PAY012',
    transactionId: 'TXN20260310001',
    loanId: 'LE-2026-38947',
    loanType: 'Business Loan',
    type: 'emi_payment',
    amount: 17580,
    date: '2026-03-10',
    status: 'successful',
    method: 'bank',
    methodDetail: 'SBI XXXX1234',
  },
  {
    id: 'PAY013',
    transactionId: 'TXN20260315001',
    loanId: 'LE-2026-91205',
    loanType: 'Vehicle Loan',
    type: 'emi_payment',
    amount: 10400,
    date: '2026-03-15',
    status: 'failed',
    method: 'card',
    methodDetail: 'HDFC XXXX5678',
  },
  {
    id: 'PAY014',
    transactionId: 'TXN20260316001',
    loanId: 'LE-2026-91205',
    loanType: 'Vehicle Loan',
    type: 'late_fee',
    amount: 500,
    date: '2026-03-16',
    status: 'successful',
    method: 'upi',
    methodDetail: 'PhonePe',
  },
  {
    id: 'PAY015',
    transactionId: 'TXN20260318001',
    loanId: 'LE-2026-91205',
    loanType: 'Vehicle Loan',
    type: 'emi_payment',
    amount: 10400,
    date: '2026-03-18',
    status: 'processing',
    method: 'bank',
    methodDetail: 'SBI XXXX1234',
  },
  {
    id: 'PAY016',
    transactionId: 'TXN20260320001',
    loanId: 'LE-2026-45821',
    loanType: 'Personal Loan',
    type: 'prepayment',
    amount: 25000,
    date: '2026-03-20',
    status: 'successful',
    method: 'bank',
    methodDetail: 'SBI XXXX1234',
  },
];

const mockPaymentMethods: PaymentMethodInfo[] = [
  {
    id: 'PM001',
    type: 'upi',
    name: 'PhonePe',
    detail: 'user@ybl',
    icon: 'cellphone',
    isDefault: true,
  },
  {
    id: 'PM002',
    type: 'bank',
    name: 'SBI Savings',
    detail: 'XXXX1234',
    icon: 'bank',
    isDefault: false,
  },
  {
    id: 'PM003',
    type: 'card',
    name: 'HDFC Credit',
    detail: 'XXXX5678',
    icon: 'credit-card',
    isDefault: false,
  },
];

const mockUpcomingPayments: UpcomingPayment[] = [
  {
    loanId: 'LE-2026-45821',
    loanType: 'Personal Loan',
    emiAmount: 12500,
    dueDate: '2026-04-05',
    isOverdue: false,
    daysLeft: 12,
  },
  {
    loanId: 'LE-2026-38947',
    loanType: 'Business Loan',
    emiAmount: 17580,
    dueDate: '2026-04-10',
    isOverdue: false,
    daysLeft: 17,
  },
  {
    loanId: 'LE-2026-91205',
    loanType: 'Vehicle Loan',
    emiAmount: 10400,
    dueDate: '2026-03-15',
    isOverdue: true,
    daysLeft: -9,
  },
];

interface PaymentStore {
  payments: Payment[];
  paymentMethods: PaymentMethodInfo[];
  upcomingPayments: UpcomingPayment[];
  isLoading: boolean;

  loadPayments: () => Promise<void>;
  processPayment: (
    loanId: string,
    amount: number,
    methodId: string,
  ) => Promise<{ success: boolean; transactionId: string }>;
}

export const usePaymentStore = create<PaymentStore>((set, get) => ({
  payments: [],
  paymentMethods: [],
  upcomingPayments: [],
  isLoading: false,

  loadPayments: async () => {
    set({ isLoading: true });
    await new Promise((resolve) => setTimeout(resolve, 1000));
    set({
      payments: mockPayments,
      paymentMethods: mockPaymentMethods,
      upcomingPayments: mockUpcomingPayments,
      isLoading: false,
    });
  },

  processPayment: async (
    loanId: string,
    amount: number,
    methodId: string,
  ) => {
    set({ isLoading: true });
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const success = Math.random() < 0.9;
    const transactionId = `TXN${Date.now()}`;

    const method = get().paymentMethods.find((m) => m.id === methodId);
    const loan = get().payments.find((p) => p.loanId === loanId);

    const newPayment: Payment = {
      id: `PAY${Date.now()}`,
      transactionId,
      loanId,
      loanType: loan?.loanType ?? 'Personal Loan',
      type: 'emi_payment',
      amount,
      date: new Date().toISOString().split('T')[0],
      status: success ? 'successful' : 'failed',
      method: method?.type ?? 'upi',
      methodDetail: method ? `${method.name} ${method.detail}` : 'PhonePe',
    };

    set((state) => ({
      payments: [newPayment, ...state.payments],
      isLoading: false,
    }));

    return { success, transactionId };
  },
}));
