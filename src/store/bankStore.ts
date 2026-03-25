import { create } from 'zustand';

export type AccountType = 'savings' | 'current';

export interface BankAccount {
  id: string;
  bankName: string;
  bankCode: string; // short code for logo/color
  accountNumber: string; // masked
  ifscCode: string;
  holderName: string;
  accountType: AccountType;
  isPrimary: boolean;
  addedOn: string;
  branchName: string;
}

export interface SavedCard {
  id: string;
  cardNumber: string; // masked, last 4
  cardHolder: string;
  expiryDate: string; // MM/YY
  cardType: 'visa' | 'mastercard' | 'rupay';
  bankName: string;
  isDefault: boolean;
}

export interface SavedUPI {
  id: string;
  upiId: string;
  appName: string; // GPay, PhonePe, etc.
  isDefault: boolean;
  isVerified: boolean;
}

export interface AutopayMandate {
  id: string;
  loanId: string;
  loanType: string;
  bankName: string;
  accountNumber: string;
  maxAmount: number;
  frequency: 'monthly' | 'quarterly';
  status: 'active' | 'paused' | 'expired';
  nextDebit: string;
}

const mockBankAccounts: BankAccount[] = [
  {
    id: 'BA001',
    bankName: 'State Bank of India',
    bankCode: 'SBI',
    accountNumber: 'XXXX XXXX 1234',
    ifscCode: 'SBIN0001234',
    holderName: 'Rahul Sharma',
    accountType: 'savings',
    isPrimary: true,
    addedOn: '2026-01-15',
    branchName: 'Connaught Place, Delhi',
  },
  {
    id: 'BA002',
    bankName: 'HDFC Bank',
    bankCode: 'HDFC',
    accountNumber: 'XXXX XXXX 5678',
    ifscCode: 'HDFC0005678',
    holderName: 'Rahul Sharma',
    accountType: 'savings',
    isPrimary: false,
    addedOn: '2026-02-10',
    branchName: 'Bandra West, Mumbai',
  },
  {
    id: 'BA003',
    bankName: 'ICICI Bank',
    bankCode: 'ICICI',
    accountNumber: 'XXXX XXXX 9012',
    ifscCode: 'ICIC0009012',
    holderName: 'Rahul Sharma',
    accountType: 'current',
    isPrimary: false,
    addedOn: '2026-03-01',
    branchName: 'Koramangala, Bangalore',
  },
];

const mockSavedCards: SavedCard[] = [
  {
    id: 'SC001',
    cardNumber: '4567',
    cardHolder: 'RAHUL SHARMA',
    expiryDate: '09/28',
    cardType: 'visa',
    bankName: 'HDFC Bank',
    isDefault: true,
  },
  {
    id: 'SC002',
    cardNumber: '8901',
    cardHolder: 'RAHUL SHARMA',
    expiryDate: '03/27',
    cardType: 'mastercard',
    bankName: 'ICICI Bank',
    isDefault: false,
  },
  {
    id: 'SC003',
    cardNumber: '2345',
    cardHolder: 'RAHUL SHARMA',
    expiryDate: '12/29',
    cardType: 'rupay',
    bankName: 'SBI',
    isDefault: false,
  },
];

const mockSavedUPI: SavedUPI[] = [
  {
    id: 'UPI001',
    upiId: 'rahul@ybl',
    appName: 'PhonePe',
    isDefault: true,
    isVerified: true,
  },
  {
    id: 'UPI002',
    upiId: 'rahul@okaxis',
    appName: 'Google Pay',
    isDefault: false,
    isVerified: true,
  },
  {
    id: 'UPI003',
    upiId: 'rahul@paytm',
    appName: 'Paytm',
    isDefault: false,
    isVerified: true,
  },
];

const mockAutopayMandates: AutopayMandate[] = [
  {
    id: 'AP001',
    loanId: 'LE-2026-45821',
    loanType: 'Personal Loan',
    bankName: 'SBI',
    accountNumber: 'XXXX1234',
    maxAmount: 15000,
    frequency: 'monthly',
    status: 'active',
    nextDebit: '2026-04-05',
  },
  {
    id: 'AP002',
    loanId: 'LE-2026-38947',
    loanType: 'Business Loan',
    bankName: 'HDFC',
    accountNumber: 'XXXX5678',
    maxAmount: 20000,
    frequency: 'monthly',
    status: 'paused',
    nextDebit: '2026-04-10',
  },
];

interface BankStoreState {
  bankAccounts: BankAccount[];
  savedCards: SavedCard[];
  savedUPI: SavedUPI[];
  autopayMandates: AutopayMandate[];
  isLoading: boolean;

  loadBankData: () => Promise<void>;
  addBankAccount: (account: Omit<BankAccount, 'id' | 'isPrimary' | 'addedOn'>) => void;
  removeBankAccount: (id: string) => void;
  setPrimaryAccount: (id: string) => void;
  addCard: (card: Omit<SavedCard, 'id' | 'isDefault'>) => void;
  removeCard: (id: string) => void;
  setDefaultCard: (id: string) => void;
  addUPI: (upi: Omit<SavedUPI, 'id' | 'isDefault' | 'isVerified'>) => void;
  removeUPI: (id: string) => void;
  setDefaultUPI: (id: string) => void;
  toggleAutopay: (id: string) => void;
}

export const useBankStore = create<BankStoreState>((set) => ({
  bankAccounts: [],
  savedCards: [],
  savedUPI: [],
  autopayMandates: [],
  isLoading: false,

  loadBankData: async () => {
    set({ isLoading: true });
    await new Promise((r) => setTimeout(r, 800));
    set({
      bankAccounts: mockBankAccounts,
      savedCards: mockSavedCards,
      savedUPI: mockSavedUPI,
      autopayMandates: mockAutopayMandates,
      isLoading: false,
    });
  },

  addBankAccount: (account) =>
    set((s) => ({
      bankAccounts: [
        ...s.bankAccounts,
        {
          ...account,
          id: `BA${Date.now()}`,
          isPrimary: s.bankAccounts.length === 0,
          addedOn: new Date().toISOString().split('T')[0],
        },
      ],
    })),

  removeBankAccount: (id) =>
    set((s) => ({
      bankAccounts: s.bankAccounts.filter((a) => a.id !== id),
    })),

  setPrimaryAccount: (id) =>
    set((s) => ({
      bankAccounts: s.bankAccounts.map((a) => ({
        ...a,
        isPrimary: a.id === id,
      })),
    })),

  addCard: (card) =>
    set((s) => ({
      savedCards: [
        ...s.savedCards,
        { ...card, id: `SC${Date.now()}`, isDefault: s.savedCards.length === 0 },
      ],
    })),

  removeCard: (id) =>
    set((s) => ({
      savedCards: s.savedCards.filter((c) => c.id !== id),
    })),

  setDefaultCard: (id) =>
    set((s) => ({
      savedCards: s.savedCards.map((c) => ({ ...c, isDefault: c.id === id })),
    })),

  addUPI: (upi) =>
    set((s) => ({
      savedUPI: [
        ...s.savedUPI,
        { ...upi, id: `UPI${Date.now()}`, isDefault: s.savedUPI.length === 0, isVerified: true },
      ],
    })),

  removeUPI: (id) =>
    set((s) => ({
      savedUPI: s.savedUPI.filter((u) => u.id !== id),
    })),

  setDefaultUPI: (id) =>
    set((s) => ({
      savedUPI: s.savedUPI.map((u) => ({ ...u, isDefault: u.id === id })),
    })),

  toggleAutopay: (id) =>
    set((s) => ({
      autopayMandates: s.autopayMandates.map((m) =>
        m.id === id
          ? { ...m, status: m.status === 'active' ? 'paused' : 'active' }
          : m,
      ),
    })),
}));
