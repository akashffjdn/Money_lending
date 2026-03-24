import { useRef } from 'react';
import { EMICalculatorRef } from '../components/shared/EMICalculatorSheet';

export const useEMICalculator = () => {
  const ref = useRef<EMICalculatorRef>(null);

  const open = (amount?: number, rate?: number, tenure?: number) => {
    ref.current?.open(amount, rate, tenure);
  };

  const close = () => {
    ref.current?.close();
  };

  return { ref, open, close };
};
