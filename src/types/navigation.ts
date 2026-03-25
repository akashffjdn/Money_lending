export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  OTP: { phone: string };
  PersonalInfo: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  LoansTab: undefined;
  ApplyTab: undefined;
  PaymentsTab: undefined;
  ProfileTab: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  Notifications: undefined;
  EMICalculator: undefined;
};

export type LoanStackParamList = {
  LoanList: undefined;
  LoanDetail: { loanId: string };
  LoanStatement: { loanId?: string } | undefined;
};

export type PaymentStackParamList = {
  PaymentDashboard: undefined;
  PaymentHistory: undefined;
};

export type ProfileStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
  KYC: undefined;
  Help: undefined;
  Settings: undefined;
  BankAccounts: undefined;
  PaymentMethods: undefined;
  EMICalendar: undefined;
};

export type ApplyStackParamList = {
  LoanApplication: undefined;
  TrackApplication: { applicationId?: string; fromTab?: string } | undefined;
};
