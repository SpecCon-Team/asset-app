export interface NotificationSender {
  id: string;
  name: string | null;
  email: string;
  role: string;
  profilePicture: string | null;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  userId: string;
  senderId?: string | null;
  sender?: NotificationSender | null;
  ticketId?: string | null;
  assetId?: string | null;
  createdAt: string;
  updatedAt: string;
}
