import { create } from 'zustand';
import type { Notification } from './types';

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchNotifications: (userId: string) => Promise<void>;
  fetchUnreadCount: (userId: string) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: (userId: string) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  fetchNotifications: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`http://localhost:4000/api/notifications/user/${userId}`, {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to fetch notifications');

      const data = await response.json();
      set({ notifications: data, isLoading: false });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  fetchUnreadCount: async (userId: string) => {
    try {
      const response = await fetch(`http://localhost:4000/api/notifications/user/${userId}/unread-count`, {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to fetch unread count');

      const data = await response.json();
      set({ unreadCount: data.count });
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  },

  markAsRead: async (notificationId: string) => {
    try {
      const response = await fetch(`http://localhost:4000/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to mark as read');

      // Update local state
      const notifications = get().notifications.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      );
      set({ notifications, unreadCount: notifications.filter((n) => !n.read).length });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  },

  markAllAsRead: async (userId: string) => {
    try {
      const response = await fetch(`http://localhost:4000/api/notifications/user/${userId}/read-all`, {
        method: 'PATCH',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to mark all as read');

      // Update local state
      const notifications = get().notifications.map((n) => ({ ...n, read: true }));
      set({ notifications, unreadCount: 0 });
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  },

  deleteNotification: async (notificationId: string) => {
    try {
      const response = await fetch(`http://localhost:4000/api/notifications/${notificationId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to delete notification');

      // Update local state
      const notifications = get().notifications.filter((n) => n.id !== notificationId);
      set({ notifications, unreadCount: notifications.filter((n) => !n.read).length });
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  },
}));
