import { create } from 'zustand';
import type { Notification } from '../types/notification';

const mockNotifications: Notification[] = [
  {
    id: 'NOTIF001',
    type: 'loan',
    title: 'EMI Due Reminder',
    description:
      'Your loan LE-2026-45821 EMI of \u20B912,500 is due in 5 days. Pay on time to maintain your credit score.',
    timestamp: '2026-03-24T09:00:00Z',
    read: false,
  },
  {
    id: 'NOTIF002',
    type: 'payment',
    title: 'Payment Successful',
    description:
      'EMI of \u20B912,500 for Personal Loan (LE-2026-45821) paid successfully via PhonePe.',
    timestamp: '2026-03-20T14:30:00Z',
    read: false,
  },
  {
    id: 'NOTIF003',
    type: 'alert',
    title: 'KYC Reminder',
    description:
      'Complete your KYC verification to unlock higher loan amounts and better interest rates.',
    timestamp: '2026-03-19T10:00:00Z',
    read: false,
  },
  {
    id: 'NOTIF004',
    type: 'promo',
    title: 'Pre-approved Loan!',
    description:
      "Congratulations! You're eligible for a pre-approved loan of \u20B95,00,000 at 12% p.a. Apply now!",
    timestamp: '2026-03-18T11:00:00Z',
    read: false,
  },
  {
    id: 'NOTIF005',
    type: 'loan',
    title: 'Loan Application Update',
    description:
      'Your Medical Loan application (LE-2026-15634) for \u20B975,000 is under review. We\'ll update you within 24 hours.',
    timestamp: '2026-03-17T16:45:00Z',
    read: true,
  },
  {
    id: 'NOTIF006',
    type: 'payment',
    title: 'Payment Failed',
    description:
      'EMI payment of \u20B910,400 for Vehicle Loan (LE-2026-91205) failed. Please retry using another payment method.',
    timestamp: '2026-03-15T12:00:00Z',
    read: true,
  },
  {
    id: 'NOTIF007',
    type: 'alert',
    title: 'Overdue EMI Alert',
    description:
      'Your Vehicle Loan (LE-2026-91205) EMI is overdue. Late fees may apply. Pay immediately to avoid penalties.',
    timestamp: '2026-03-16T08:00:00Z',
    read: false,
  },
  {
    id: 'NOTIF008',
    type: 'promo',
    title: 'Refer & Earn',
    description:
      'Refer a friend to LendEase and earn \u20B9500 cashback on your next EMI payment. T&C apply.',
    timestamp: '2026-03-14T09:30:00Z',
    read: true,
  },
  {
    id: 'NOTIF009',
    type: 'payment',
    title: 'Business Loan EMI Paid',
    description:
      'EMI of \u20B917,580 for Business Loan (LE-2026-38947) debited from SBI XXXX1234 successfully.',
    timestamp: '2026-03-10T10:15:00Z',
    read: true,
  },
  {
    id: 'NOTIF010',
    type: 'loan',
    title: 'Credit Score Updated',
    description:
      'Your credit score has been updated to 742. Maintain timely payments to improve it further.',
    timestamp: '2026-03-08T07:00:00Z',
    read: true,
  },
];

interface NotificationStore {
  notifications: Notification[];
  isLoading: boolean;

  readonly unreadCount: number;

  loadNotifications: () => Promise<void>;
  markAsRead: (id: string) => void;
  markAllRead: () => void;
  deleteNotification: (id: string) => void;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  isLoading: false,

  get unreadCount(): number {
    return get().notifications.filter((n) => !n.read).length;
  },

  loadNotifications: async () => {
    set({ isLoading: true });
    await new Promise((resolve) => setTimeout(resolve, 800));
    set({ notifications: mockNotifications, isLoading: false });
  },

  markAsRead: (id: string) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      ),
    })),

  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),

  deleteNotification: (id: string) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
}));

/** Selector hook for unread count to avoid getter issues */
export const useUnreadCount = () =>
  useNotificationStore((state) =>
    state.notifications.filter((n) => !n.read).length,
  );
