export interface EMIResult {
  emi: number;
  totalInterest: number;
  totalPayable: number;
  principal: number;
}

export const calculateEMI = (
  principal: number,
  annualRate: number,
  tenureMonths: number
): EMIResult => {
  if (principal <= 0 || annualRate <= 0 || tenureMonths <= 0) {
    return { emi: 0, totalInterest: 0, totalPayable: 0, principal: 0 };
  }

  const monthlyRate = annualRate / 12 / 100;
  const factor = Math.pow(1 + monthlyRate, tenureMonths);
  const emi = (principal * monthlyRate * factor) / (factor - 1);
  const totalPayable = emi * tenureMonths;
  const totalInterest = totalPayable - principal;

  return {
    emi: Math.round(emi),
    totalInterest: Math.round(totalInterest),
    totalPayable: Math.round(totalPayable),
    principal,
  };
};

export interface ScheduleEntry {
  month: number;
  emi: number;
  principal: number;
  interest: number;
  balance: number;
}

export const generateSchedule = (
  principal: number,
  annualRate: number,
  tenureMonths: number
): ScheduleEntry[] => {
  const monthlyRate = annualRate / 12 / 100;
  const { emi } = calculateEMI(principal, annualRate, tenureMonths);

  const schedule: ScheduleEntry[] = [];
  let balance = principal;

  for (let month = 1; month <= tenureMonths; month++) {
    const interest = Math.round(balance * monthlyRate);
    const principalPart = Math.round(emi - interest);
    balance = Math.max(0, balance - principalPart);

    schedule.push({
      month,
      emi,
      principal: principalPart,
      interest,
      balance,
    });
  }

  return schedule;
};
