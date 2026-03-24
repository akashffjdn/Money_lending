import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export const formatDate = (date: string, format = 'DD MMM YYYY'): string => {
  return dayjs(date).format(format);
};

export const formatRelativeTime = (date: string): string => {
  return dayjs(date).fromNow();
};

export const getDaysUntil = (date: string): number => {
  return dayjs(date).diff(dayjs(), 'day');
};

export const getGreeting = (): string => {
  const hour = dayjs().hour();
  if (hour >= 5 && hour < 12) return 'Good Morning';
  if (hour >= 12 && hour < 17) return 'Good Afternoon';
  if (hour >= 17 && hour < 21) return 'Good Evening';
  return 'Good Night';
};
