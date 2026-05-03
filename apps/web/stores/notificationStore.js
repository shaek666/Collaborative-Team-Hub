import { create } from 'zustand';
import api from '../lib/api';

export const useNotificationStore = create((set, get) => ({
  notifications: [],

  fetchNotifications: async () => {
    try {
      const res = await api.get('/notifications');
      set({ notifications: res.data });
    } catch (error) {
      throw error;
    }
  },

  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
    })),

  markAsRead: async (notificationId) => {
    const previousNotifications = get().notifications;

    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== notificationId),
    }));

    try {
      await api.patch(`/notifications/${notificationId}/read`);
    } catch (error) {
      set({ notifications: previousNotifications });
      throw error;
    }
  },

  markAllAsRead: async () => {
    const previousNotifications = get().notifications;

    set({ notifications: [] });

    try {
      await api.patch('/notifications/read-all');
    } catch (error) {
      set({ notifications: previousNotifications });
      throw error;
    }
  },
}));
