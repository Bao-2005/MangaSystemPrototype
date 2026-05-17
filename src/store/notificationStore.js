import { create } from 'zustand';
import { notifications as initialNotifications } from '../data/notifications';

export const useNotificationStore = create((set, get) => ({
  notifications: [...initialNotifications],

  getByRecipient: (userId) => get().notifications.filter(n => n.recipientId === userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
  getUnreadCount: (userId) => get().notifications.filter(n => n.recipientId === userId && !n.read).length,

  markAsRead: (notifId) => {
    set(state => ({
      notifications: state.notifications.map(n => n.id === notifId ? { ...n, read: true } : n),
    }));
  },

  markAllAsRead: (userId) => {
    set(state => ({
      notifications: state.notifications.map(n => n.recipientId === userId ? { ...n, read: true } : n),
    }));
  },

  addNotification: (notif) => {
    const id = `N${String(get().notifications.length + 1).padStart(2, '0')}`;
    set(state => ({
      notifications: [{ ...notif, id, read: false, createdAt: new Date().toISOString() }, ...state.notifications],
    }));
  },
}));
