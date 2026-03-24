export type KYCStepStatus = 'not_started' | 'in_progress' | 'completed' | 'rejected';
export type KYCOverallStatus = 'not_started' | 'in_progress' | 'under_review' | 'verified' | 'rejected';
export type AddressDocType = 'utility_bill' | 'rent_agreement' | 'passport' | 'voter_id';

export interface KYCStep {
  id: number;
  name: string;
  status: KYCStepStatus;
}

export interface KYCData {
  panNumber: string;
  panImage?: string;
  aadhaarNumber: string;
  aadhaarFront?: string;
  aadhaarBack?: string;
  selfieImage?: string;
  bankStatement?: string;
  bankStatementName?: string;
  addressDocType: AddressDocType | null;
  addressDocImage?: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
}
