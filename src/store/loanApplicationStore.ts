import { create } from 'zustand';
import type { LoanApplication } from '../types/loan';

const defaultApplication: LoanApplication = {
  loanType: null,
  amount: 100000,
  tenure: 12,
  interestRate: 14.5,
  employmentType: null,
  companyName: '',
  designation: '',
  monthlyIncome: 0,
  experience: 0,
  businessName: '',
  businessType: '',
  annualTurnover: 0,
  yearsInBusiness: 0,
  residentialStatus: null,
  monthlyExpenses: 0,
  existingEmi: 0,
};

interface LoanApplicationStore {
  currentStep: number;
  application: LoanApplication;
  referenceId: string | null;

  setStep: (step: number) => void;
  updateApplication: (partial: Partial<LoanApplication>) => void;
  submitApplication: () => string;
  resetApplication: () => void;
}

function generateReferenceId(): string {
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `LE-2026-${randomNum}`;
}

export const useLoanApplicationStore = create<LoanApplicationStore>((set) => ({
  currentStep: 0,
  application: { ...defaultApplication },
  referenceId: null,

  setStep: (step: number) => {
    if (step < 0 || step > 4) return;
    set({ currentStep: step });
  },

  updateApplication: (partial: Partial<LoanApplication>) =>
    set((state) => ({
      application: { ...state.application, ...partial },
    })),

  submitApplication: () => {
    const refId = generateReferenceId();
    set({ referenceId: refId });
    return refId;
  },

  resetApplication: () =>
    set({
      currentStep: 0,
      application: { ...defaultApplication },
      referenceId: null,
    }),
}));
