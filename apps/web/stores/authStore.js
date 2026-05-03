import { create } from 'zustand';
import api from '../lib/api';
import { connectSocket, disconnectSocket } from '../lib/socket';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  fetchMe: async () => {
    try {
      const res = await api.get('/auth/me');
      set({ user: res.data, isAuthenticated: true, isLoading: false });
      connectSocket();
    } catch (error) {
      set({ user: null, isAuthenticated: false, isLoading: false });
      disconnectSocket();
    }
  },

  login: async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      set({ user: res.data, isAuthenticated: true });
      connectSocket();
      return res.data;
    } catch (error) {
      disconnectSocket();
      throw error;
    }
  },

  register: async (name, email, password) => {
    try {
      const res = await api.post('/auth/register', { name, email, password });
      set({ user: res.data, isAuthenticated: true });
      connectSocket();
      return res.data;
    } catch (error) {
      disconnectSocket();
      throw error;
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
      set({ user: null, isAuthenticated: false });
      disconnectSocket();
    } catch (error) {
      throw error;
    }
  },

  setUser: (user) => set({ user, isAuthenticated: !!user }),
}));
