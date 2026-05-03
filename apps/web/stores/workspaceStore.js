import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/api';

export const useWorkspaceStore = create(
  persist(
    (set, get) => ({
      workspaces: [],
      activeWorkspace: null,
      members: [],
      onlineMembers: [],

      fetchWorkspaces: async () => {
        try {
          const res = await api.get('/workspaces');
          set({ workspaces: res.data });
          const currentActive = get().activeWorkspace;
          if (res.data.length > 0) {
            const match = currentActive 
              ? res.data.find((ws) => ws.id === currentActive.id)
              : res.data[0];
            if (match) {
              await get().setActiveWorkspace(match);
            }
          }
        } catch (error) {
          throw error;
        }
      },

      setActiveWorkspace: async (workspace) => {
        try {
          set({ activeWorkspace: workspace });
          if (workspace) {
            const res = await api.get(`/workspaces/${workspace.id}`);
            set({ members: res.data.members });
          } else {
            set({ members: [] });
          }
        } catch (error) {
          throw error;
        }
      },

      setOnlineMembers: (userIds) => set({ onlineMembers: userIds }),

      createWorkspace: async (data) => {
        try {
          const res = await api.post('/workspaces', data);
          set((state) => ({
            workspaces: [...state.workspaces, res.data]
          }));
          return res.data;
        } catch (error) {
          throw error;
        }
      },
    }),
    {
      name: 'workspace-storage',
      partialize: (state) => ({
        activeWorkspace: state.activeWorkspace,
      }),
    }
  )
);
