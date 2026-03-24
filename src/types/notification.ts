export type NotificationType = 'loan' | 'payment' | 'alert' | 'promo';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
}
