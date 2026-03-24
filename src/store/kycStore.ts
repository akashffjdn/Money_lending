import { create } from 'zustand';
import type { KYCOverallStatus, KYCStep, KYCData, KYCStepStatus } from '../types/kyc';

const initialSteps: KYCStep[] = [
  { id: 1, name: 'PAN Card', status: 'not_started' },
  { id: 2, name: 'Aadhaar Card', status: 'not_started' },
  { id: 3, name: 'Selfie', status: 'not_started' },
  { id: 4, name: 'Bank Statement', status: 'not_started' },
  { id: 5, name: 'Address Proof', status: 'not_started' },
];

const initialData: KYCData = {
  panNumber: '',
  panImage: undefined,
  aadhaarNumber: '',
  aadhaarFront: undefined,
  aadhaarBack: undefined,
  selfieImage: undefined,
  bankStatement: undefined,
  bankStatementName: undefined,
  addressDocType: null,
  addressDocImage: undefined,
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  pincode: '',
};

interface KYCStore {
  overallStatus: KYCOverallStatus;
  currentStep: number;
  steps: KYCStep[];
  data: KYCData;
  isLoading: boolean;

  updateStep: (stepId: number, status: KYCStepStatus) => void;
  updateData: (partial: Partial<KYCData>) => void;
  submitKYC: () => void;
  resetKYC: () => void;
}

export const useKYCStore = create<KYCStore>((set) => ({
  overallStatus: 'not_started',
  currentStep: 1,
  steps: [...initialSteps],
  data: { ...initialData },
  isLoading: false,

  updateStep: (stepId: number, status: KYCStepStatus) =>
    set((state) => {
      const updatedSteps = state.steps.map((step) =>
        step.id === stepId ? { ...step, status } : step,
      );

      // Advance currentStep to the next incomplete step
      const nextIncomplete = updatedSteps.find(
        (s) => s.status === 'not_started' || s.status === 'in_progress',
      );
      const nextStep = nextIncomplete ? nextIncomplete.id : state.currentStep;

      // Determine overall status
      const allCompleted = updatedSteps.every((s) => s.status === 'completed');
      const anyInProgress = updatedSteps.some(
        (s) => s.status === 'in_progress' || s.status === 'completed',
      );

      let overallStatus: KYCOverallStatus = state.overallStatus;
      if (allCompleted) {
        overallStatus = 'in_progress'; // Ready to submit
      } else if (anyInProgress) {
        overallStatus = 'in_progress';
      }

      return {
        steps: updatedSteps,
        currentStep: nextStep,
        overallStatus,
      };
    }),

  updateData: (partial: Partial<KYCData>) =>
    set((state) => ({
      data: { ...state.data, ...partial },
    })),

  submitKYC: () =>
    set({
      overallStatus: 'under_review',
      isLoading: false,
    }),

  resetKYC: () =>
    set({
      overallStatus: 'not_started',
      currentStep: 1,
      steps: initialSteps.map((s) => ({ ...s })),
      data: { ...initialData },
      isLoading: false,
    }),
}));
