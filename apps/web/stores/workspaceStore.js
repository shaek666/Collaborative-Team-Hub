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
            const currentActive = get().activeWorkspace;
            let match = currentActive 
              ? res.data.find((ws) => ws.id === currentActive.id)
              : null;
            
            if (!match && res.data.length > 0) {
              match = res.data[0];
            }
            
            if (match) {
              const wsRes = await api.get(`/workspaces/${match.id}`);
              set({ workspaces: res.data, activeWorkspace: match, members: wsRes.data.members });
            } else {
              set({ workspaces: res.data, activeWorkspace: null, members: [] });
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

    clearWorkspace: () => {
      set({ workspaces: [], activeWorkspace: null, members: [], onlineMembers: [] });
    },

    {
      name: 'workspace-storage',
      partialize: (state) => ({
        activeWorkspace: state.activeWorkspace,
      }),
    }
  )
);