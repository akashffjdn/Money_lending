import { create } from 'zustand';
import type { LoanApplication, SubmittedApplication } from '../types/loan';

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
  submittedApplications: SubmittedApplication[];

  setStep: (step: number) => void;
  updateApplication: (partial: Partial<LoanApplication>) => void;
  submitApplication: () => string;
  resetApplication: () => void;
}

function generateReferenceId(): string {
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `LE-2026-${randomNum}`;
}

// Mock submitted applications for testing
const MOCK_SUBMITTED: SubmittedApplication[] = [
  {
    id: '1',
    referenceId: 'LE-2026-48291',
    application: {
      loanType: 'personal',
      amount: 250000,
      tenure: 24,
      interestRate: 12.5,
      employmentType: 'salaried',
      companyName: 'TCS',
      designation: 'Software Engineer',
      monthlyIncome: 85000,
      experience: 4,
      businessName: '',
      businessType: '',
      annualTurnover: 0,
      yearsInBusiness: 0,
      residentialStatus: 'rented',
      monthlyExpenses: 30000,
      existingEmi: 5000,
    },
    status: 'verification',
    submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
  },
  {
    id: '2',
    referenceId: 'LE-2026-73154',
    application: {
      loanType: 'business',
      amount: 500000,
      tenure: 36,
      interestRate: 14.0,
      employmentType: 'self_employed',
      companyName: '',
      designation: '',
      monthlyIncome: 120000,
      experience: 0,
      businessName: 'NextGen Solutions',
      businessType: 'IT Services',
      annualTurnover: 1500000,
      yearsInBusiness: 5,
      residentialStatus: 'owned',
      monthlyExpenses: 45000,
      existingEmi: 12000,
    },
    status: 'approved',
    submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
  },
  {
    id: '3',
    referenceId: 'LE-2026-19487',
    application: {
      loanType: 'education',
      amount: 150000,
      tenure: 12,
      interestRate: 10.5,
      employmentType: 'salaried',
      companyName: 'Infosys',
      designation: 'Analyst',
      monthlyIncome: 55000,
      experience: 2,
      businessName: '',
      businessType: '',
      annualTurnover: 0,
      yearsInBusiness: 0,
      residentialStatus: 'family',
      monthlyExpenses: 20000,
      existingEmi: 0,
    },
    status: 'disbursed',
    submittedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
  },
];

export const useLoanApplicationStore = create<LoanApplicationStore>((set, get) => ({
  currentStep: 0,
  application: { ...defaultApplication },
  referenceId: null,
  submittedApplications: MOCK_SUBMITTED,

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
    const { application, submittedApplications } = get();
    const submitted: SubmittedApplication = {
      id: Date.now().toString(),
      referenceId: refId,
      application: { ...application },
      status: 'submitted',
      submittedAt: new Date().toISOString(),
    };
    set({
      referenceId: refId,
      submittedApplications: [submitted, ...submittedApplications],
    });
    return refId;
  },

  resetApplication: () =>
    set({
      currentStep: 0,
      application: { ...defaultApplication },
      referenceId: null,
    }),
}));
