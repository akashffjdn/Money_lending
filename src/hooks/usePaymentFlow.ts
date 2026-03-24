import { useRef } from 'react';
import type { PaymentFlowRef } from '../components/shared/PaymentFlowSheet';

export const usePaymentFlow = () => {
  const ref = useRef<PaymentFlowRef>(null);

  const open = (loanId: string, amount: number, loanType?: string) => {
    ref.current?.open(loanId, amount, loanType);
  };

  const close = () => {
    ref.current?.close();
  };

  return { ref, open, close };
};
