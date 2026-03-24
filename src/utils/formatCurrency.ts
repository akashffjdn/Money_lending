export const formatCurrency = (amount: number, showDecimal = false): string => {
  const isNegative = amount < 0;
  const abs = Math.abs(amount);

  let formatted: string;
  if (showDecimal) {
    formatted = abs.toFixed(2);
  } else {
    formatted = Math.round(abs).toString();
  }

  // Indian numbering system: last 3 digits, then groups of 2
  const parts = formatted.split('.');
  let intPart = parts[0];
  const decPart = parts[1];

  if (intPart.length > 3) {
    const last3 = intPart.slice(-3);
    const rest = intPart.slice(0, -3);
    const restFormatted = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    intPart = restFormatted + ',' + last3;
  }

  const result = decPart ? `${intPart}.${decPart}` : intPart;
  return `${isNegative ? '-' : ''}₹${result}`;
};

export const formatAmountShort = (amount: number): string => {
  const abs = Math.abs(amount);
  if (abs >= 10000000) return `₹${(abs / 10000000).toFixed(1)} Cr`;
  if (abs >= 100000) return `₹${(abs / 100000).toFixed(1)} L`;
  if (abs >= 1000) return `₹${(abs / 1000).toFixed(1)}K`;
  return `₹${abs}`;
};
