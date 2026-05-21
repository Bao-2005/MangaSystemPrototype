import { create } from 'zustand';
import { users } from '../data/users';

export const useAuthStore = create((set, get) => ({
  currentUser: null,
  users: [...users],

  login: (userId) => {
    const user = get().users.find(u => u.id === userId);
    if (user && user.status === 'Active') {
      set({ currentUser: user });
      return true;
    }
    return false;
  },

  logout: () => set({ currentUser: null }),

  hasRole: (role) => {
    const user = get().currentUser;
    return user?.roles?.includes(role) || false;
  },

  hasAnyRole: (roles) => {
    const user = get().currentUser;
    return user?.roles?.some(r => roles.includes(r)) || false;
  },

  getUserById: (id) => get().users.find(u => u.id === id),

  getAssistants: () => get().users.filter(u => u.roles.includes('Assistant') && u.status === 'Active'),

  getBoardMembers: () => get().users.filter(u => u.roles.includes('Editorial Board') && u.status === 'Active'),

  // Add new user (used by Editorial Office Admin)
  addUser: (userData) => {
    const id = `U${String(get().users.length + 1).padStart(2, '0')}`;
    const newUser = {
      ...userData,
      id,
      status: 'Active',
      joinedAt: new Date().toISOString().split('T')[0],
      performanceScore: 0,
    };
    set(state => ({ users: [...state.users, newUser] }));
    return newUser;
  },
}));

