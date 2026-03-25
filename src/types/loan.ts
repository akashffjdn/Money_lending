export type LoanType = 'personal' | 'business' | 'education' | 'medical' | 'home_renovation' | 'vehicle';
export type LoanStatus = 'pending' | 'approved' | 'active' | 'closed' | 'rejected' | 'overdue';

export interface Loan {
  id: string;
  type: LoanType;
  typeLabel: string;
  status: LoanStatus;
  sanctionedAmount: number;
  outstandingAmount: number;
  disbursedAmount: number;
  interestRate: number;
  tenure: number; // months
  emiAmount: number;
  emiPaid: number;
  totalEmis: number;
  nextEmiDate: string;
  disbursementDate: string;
  processingFee: number;
  totalInterest: number;
  totalPayable: number;
  bankName: string;
  accountNumber: string;
  autoDebit: boolean;
  repaymentSchedule: RepaymentEntry[];
}

export interface RepaymentEntry {
  month: number;
  dueDate: string;
  amount: number;
  principal: number;
  interest: number;
  balance: number;
  status: 'paid' | 'upcoming' | 'overdue' | 'current';
}

export type ApplicationStatus = 'submitted' | 'verification' | 'credit_check' | 'approved' | 'disbursed' | 'rejected';

export interface SubmittedApplication {
  id: string;
  referenceId: string;
  application: LoanApplication;
  status: ApplicationStatus;
  submittedAt: string; // ISO date
}

export interface LoanApplication {
  loanType: LoanType | null;
  amount: number;
  tenure: number;
  interestRate: number;
  employmentType: 'salaried' | 'self_employed' | 'business_owner' | null;
  companyName: string;
  designation: string;
  monthlyIncome: number;
  experience: number;
  businessName: string;
  businessType: string;
  annualTurnover: number;
  yearsInBusiness: number;
  residentialStatus: 'owned' | 'rented' | 'family' | null;
  monthlyExpenses: number;
  existingEmi: number;
}
