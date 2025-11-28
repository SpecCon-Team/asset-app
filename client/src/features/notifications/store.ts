import { create } from 'zustand';
import type { Notification } from './types';
import { getApiBaseUrl } from '@/lib/apiConfig';

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchNotifications: (userId: string, limit?: number) => Promise<void>;
  fetchUnreadCount: (userId: string) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: (userId: string) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  dismissAllNotifications: (userId: string) => Promise<void>;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  fetchNotifications: async (userId: string, limit: number = 50) => {
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const url = `${getApiBaseUrl()}/notifications/user/${userId}?limit=${limit}`;

      const response = await fetch(url, {
        credentials: 'include',
        headers,
      });

      if (response.status === 401 || response.status === 403) {
        set({ notifications: [], isLoading: false, error: null });
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.statusText}`);
      }

      const data = await response.json();
      set({ notifications: data, isLoading: false });
    } catch (error: any) {
      if (error?.message?.includes('Failed to fetch') || error?.code === 'ERR_NETWORK') {
        set({ notifications: [], isLoading: false, error: null });
        return;
      }
      console.error('Error fetching notifications:', error);
      set({ error: (error as Error).message, isLoading: false, notifications: [] });
    }
  },

  fetchUnreadCount: async (userId: string) => {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${getApiBaseUrl()}/notifications/user/${userId}/unread-count`, {
        credentials: 'include',
        headers,
      });

      if (response.status === 401 || response.status === 403) {
        set({ unreadCount: 0 });
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch unread count: ${response.statusText}`);
      }

      const data = await response.json();
      set({ unreadCount: data.count });
    } catch (error: any) {
      if (error?.message?.includes('Failed to fetch') || error?.code === 'ERR_NETWORK') {
        set({ unreadCount: 0 });
        return;
      }
      console.error('Failed to fetch unread count:', error);
      set({ unreadCount: 0 });
    }
  },

  markAsRead: async (notificationId: string) => {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${getApiBaseUrl()}/notifications/${notificationId}/read`, {
        method: 'PATCH',
        credentials: 'include',
        headers,
      });

      if (!response.ok) throw new Error('Failed to mark as read');

      const notifications = get().notifications.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      );
      set({ notifications, unreadCount: notifications.filter((n) => !n.read).length });
    } catch (error: any) {
      if (error?.message?.includes('Failed to fetch') || error?.code === 'ERR_NETWORK') {
        return;
      }
      console.error('Failed to mark notification as read:', error);
    }
  },

  markAllAsRead: async (userId: string) => {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${getApiBaseUrl()}/notifications/user/${userId}/read-all`, {
        method: 'PATCH',
        credentials: 'include',
        headers,
      });

      if (!response.ok) throw new Error('Failed to mark all as read');

      const notifications = get().notifications.map((n) => ({ ...n, read: true }));
      set({ notifications, unreadCount: 0 });
    } catch (error: any) {
      if (error?.message?.includes('Failed to fetch') || error?.code === 'ERR_NETWORK') {
        return;
      }
      console.error('Failed to mark all as read:', error);
    }
  },

  deleteNotification: async (notificationId: string) => {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${getApiBaseUrl()}/notifications/${notificationId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers,
      });

      if (!response.ok) throw new Error('Failed to delete notification');

      const notifications = get().notifications.filter((n) => n.id !== notificationId);
      set({ notifications, unreadCount: notifications.filter((n) => !n.read).length });
    } catch (error: any) {
      if (error?.message?.includes('Failed to fetch') || error?.code === 'ERR_NETWORK') {
        return;
      }
      console.error('Failed to delete notification:', error);
    }
  },

  dismissAllNotifications: async (userId: string) => {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${getApiBaseUrl()}/notifications/user/${userId}/dismiss-all`, {
        method: 'DELETE',
        credentials: 'include',
        headers,
      });

      if (!response.ok) throw new Error('Failed to dismiss all notifications');

      set({ notifications: [], unreadCount: 0 });
    } catch (error: any) {
      if (error?.message?.includes('Failed to fetch') || error?.code === 'ERR_NETWORK') {
        return;
      }
      console.error('Failed to dismiss all notifications:', error);
    }
  },
}));
