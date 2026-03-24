import { create } from 'zustand';
import type { Loan, RepaymentEntry } from '../types/loan';

const personalLoanSchedule: RepaymentEntry[] = [
  { month: 1, dueDate: '2025-05-05', amount: 12500, principal: 9479, interest: 3021, balance: 240521, status: 'paid' },
  { month: 2, dueDate: '2025-06-05', amount: 12500, principal: 9593, interest: 2907, balance: 230928, status: 'paid' },
  { month: 3, dueDate: '2025-07-05', amount: 12500, principal: 9709, interest: 2791, balance: 221219, status: 'paid' },
  { month: 4, dueDate: '2025-08-05', amount: 12500, principal: 9827, interest: 2673, balance: 211392, status: 'paid' },
  { month: 5, dueDate: '2025-09-05', amount: 12500, principal: 9946, interest: 2554, balance: 201446, status: 'paid' },
  { month: 6, dueDate: '2025-10-05', amount: 12500, principal: 10066, interest: 2434, balance: 191380, status: 'paid' },
  { month: 7, dueDate: '2025-11-05', amount: 12500, principal: 10188, interest: 2312, balance: 181192, status: 'paid' },
  { month: 8, dueDate: '2025-12-05', amount: 12500, principal: 10311, interest: 2189, balance: 170881, status: 'paid' },
  { month: 9, dueDate: '2026-01-05', amount: 12500, principal: 10436, interest: 2064, balance: 160445, status: 'paid' },
  { month: 10, dueDate: '2026-02-05', amount: 12500, principal: 10562, interest: 1938, balance: 149883, status: 'paid' },
  { month: 11, dueDate: '2026-03-05', amount: 12500, principal: 10690, interest: 1810, balance: 139193, status: 'paid' },
  { month: 12, dueDate: '2026-04-05', amount: 12500, principal: 10819, interest: 1681, balance: 128374, status: 'current' },
  { month: 13, dueDate: '2026-05-05', amount: 12500, principal: 10950, interest: 1550, balance: 117424, status: 'upcoming' },
  { month: 14, dueDate: '2026-06-05', amount: 12500, principal: 11083, interest: 1417, balance: 106341, status: 'upcoming' },
];

const businessLoanSchedule: RepaymentEntry[] = [
  { month: 1, dueDate: '2025-08-10', amount: 17580, principal: 10913, interest: 6667, balance: 489087, status: 'paid' },
  { month: 2, dueDate: '2025-09-10', amount: 17580, principal: 11059, interest: 6521, balance: 478028, status: 'paid' },
  { month: 3, dueDate: '2025-10-10', amount: 17580, principal: 11206, interest: 6374, balance: 466822, status: 'paid' },
  { month: 4, dueDate: '2025-11-10', amount: 17580, principal: 11355, interest: 6225, balance: 455467, status: 'paid' },
  { month: 5, dueDate: '2025-12-10', amount: 17580, principal: 11507, interest: 6073, balance: 443960, status: 'paid' },
  { month: 6, dueDate: '2026-01-10', amount: 17580, principal: 11660, interest: 5920, balance: 432300, status: 'paid' },
  { month: 7, dueDate: '2026-02-10', amount: 17580, principal: 11816, interest: 5764, balance: 420484, status: 'paid' },
  { month: 8, dueDate: '2026-03-10', amount: 17580, principal: 11973, interest: 5607, balance: 408511, status: 'paid' },
  { month: 9, dueDate: '2026-04-10', amount: 17580, principal: 12133, interest: 5447, balance: 396378, status: 'current' },
  { month: 10, dueDate: '2026-05-10', amount: 17580, principal: 12295, interest: 5285, balance: 384083, status: 'upcoming' },
  { month: 11, dueDate: '2026-06-10', amount: 17580, principal: 12459, interest: 5121, balance: 371624, status: 'upcoming' },
  { month: 12, dueDate: '2026-07-10', amount: 17580, principal: 12625, interest: 4955, balance: 358999, status: 'upcoming' },
];

const mockLoans: Loan[] = [
  {
    id: 'LE-2026-45821',
    type: 'personal',
    typeLabel: 'Personal Loan',
    status: 'active',
    sanctionedAmount: 250000,
    outstandingAmount: 125000,
    disbursedAmount: 250000,
    interestRate: 14.5,
    tenure: 24,
    emiAmount: 12500,
    emiPaid: 12,
    totalEmis: 24,
    nextEmiDate: '2026-04-05',
    disbursementDate: '2025-04-05',
    processingFee: 2500,
    totalInterest: 50000,
    totalPayable: 300000,
    bankName: 'SBI',
    accountNumber: 'XXXX1234',
    autoDebit: true,
    repaymentSchedule: personalLoanSchedule,
  },
  {
    id: 'LE-2026-38947',
    type: 'business',
    typeLabel: 'Business Loan',
    status: 'active',
    sanctionedAmount: 500000,
    outstandingAmount: 375000,
    disbursedAmount: 500000,
    interestRate: 16,
    tenure: 36,
    emiAmount: 17580,
    emiPaid: 8,
    totalEmis: 36,
    nextEmiDate: '2026-04-10',
    disbursementDate: '2025-07-10',
    processingFee: 5000,
    totalInterest: 132880,
    totalPayable: 632880,
    bankName: 'HDFC',
    accountNumber: 'XXXX5678',
    autoDebit: true,
    repaymentSchedule: businessLoanSchedule,
  },
  {
    id: 'LE-2026-72310',
    type: 'education',
    typeLabel: 'Education Loan',
    status: 'closed',
    sanctionedAmount: 150000,
    outstandingAmount: 0,
    disbursedAmount: 150000,
    interestRate: 12,
    tenure: 12,
    emiAmount: 13330,
    emiPaid: 12,
    totalEmis: 12,
    nextEmiDate: '',
    disbursementDate: '2025-01-15',
    processingFee: 1500,
    totalInterest: 9960,
    totalPayable: 159960,
    bankName: 'ICICI',
    accountNumber: 'XXXX9012',
    autoDebit: false,
    repaymentSchedule: [],
  },
  {
    id: 'LE-2026-15634',
    type: 'medical',
    typeLabel: 'Medical Loan',
    status: 'pending',
    sanctionedAmount: 75000,
    outstandingAmount: 0,
    disbursedAmount: 0,
    interestRate: 18,
    tenure: 6,
    emiAmount: 0,
    emiPaid: 0,
    totalEmis: 6,
    nextEmiDate: '',
    disbursementDate: '',
    processingFee: 750,
    totalInterest: 4230,
    totalPayable: 79230,
    bankName: '',
    accountNumber: '',
    autoDebit: false,
    repaymentSchedule: [],
  },
  {
    id: 'LE-2026-91205',
    type: 'vehicle',
    typeLabel: 'Vehicle Loan',
    status: 'overdue',
    sanctionedAmount: 300000,
    outstandingAmount: 210000,
    disbursedAmount: 300000,
    interestRate: 15,
    tenure: 36,
    emiAmount: 10400,
    emiPaid: 3,
    totalEmis: 36,
    nextEmiDate: '2026-03-15',
    disbursementDate: '2025-12-15',
    processingFee: 3000,
    totalInterest: 74400,
    totalPayable: 374400,
    bankName: 'Axis',
    accountNumber: 'XXXX3456',
    autoDebit: false,
    repaymentSchedule: [],
  },
];

interface LoanStore {
  loans: Loan[];
  isLoading: boolean;

  loadLoans: () => Promise<void>;
  getLoanById: (id: string) => Loan | undefined;
}

export const useLoanStore = create<LoanStore>((set, get) => ({
  loans: [],
  isLoading: false,

  loadLoans: async () => {
    set({ isLoading: true });
    await new Promise((resolve) => setTimeout(resolve, 1500));
    set({ loans: mockLoans, isLoading: false });
  },

  getLoanById: (id: string) => {
    return get().loans.find((loan) => loan.id === id);
  },
}));
