export interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
  profileComplete: boolean;
  kycStatus: 'not_started' | 'in_progress' | 'under_review' | 'verified' | 'rejected';
  creditScore: number;
  avatar?: string;
}
