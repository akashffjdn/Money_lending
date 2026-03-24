export const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length <= 5) return cleaned;
  return `${cleaned.slice(0, 5)} ${cleaned.slice(5, 10)}`;
};

export const maskPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 10) return phone;
  return `+91 ${cleaned.slice(0, 5)} ${'X'.repeat(5)}`;
};

export const maskEmail = (email: string): string => {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}${'*'.repeat(Math.min(local.length - 2, 3))}${local[local.length - 1]}@${domain}`;
};
