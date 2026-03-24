const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockApi = {
  sendOTP: async (phone: string): Promise<{ success: boolean }> => {
    await delay(500);
    return { success: true };
  },

  verifyOTP: async (
    phone: string,
    otp: string
  ): Promise<{ success: boolean; isNewUser: boolean; token: string }> => {
    await delay(500);
    return {
      success: true,
      isNewUser: true,
      token: `mock_token_${Date.now()}`,
    };
  },

  submitLoanApplication: async (
    data: Record<string, unknown>
  ): Promise<{ success: boolean; referenceId: string }> => {
    await delay(1500);
    const refId = `LE-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    return { success: true, referenceId: refId };
  },

  processPayment: async (
    loanId: string,
    amount: number,
    methodId: string
  ): Promise<{
    success: boolean;
    transactionId: string;
    message: string;
  }> => {
    await delay(2000);
    const success = Math.random() > 0.1;
    return {
      success,
      transactionId: `TXN-${Date.now()}`,
      message: success
        ? 'Payment processed successfully'
        : 'Payment failed. Insufficient funds.',
    };
  },

  submitKYC: async (): Promise<{ success: boolean; status: string }> => {
    await delay(1000);
    return { success: true, status: 'under_review' };
  },
};
