import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/api';
import { connectSocket, disconnectSocket } from '../lib/socket';

export const useAuthStore = create(
  persist(
    (set, get) => ({
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
          // Clear persisted state on auth failure
          get().clearAuth();
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
         } catch (error) {
           // Continue with logout even if API call fails
         }
         set({ user: null, isAuthenticated: false, isLoading: false });
         disconnectSocket();
         // Clear persisted state
         get().clearAuth();
         // Clear workspace state
         const { clearWorkspace } = useWorkspaceStore.getState();
         clearWorkspace();
       },

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      clearAuth: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth-storage');
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
