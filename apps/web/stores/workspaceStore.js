import { create } from 'zustand';
import api from '../lib/api';

export const useWorkspaceStore = create((set, get) => ({
  workspaces: [],
  activeWorkspace: null,
  members: [],
  onlineMembers: [],

  fetchWorkspaces: async () => {
    try {
      const res = await api.get('/workspaces');
      set({ workspaces: res.data });
      if (res.data.length > 0 && !get().activeWorkspace) {
        await get().setActiveWorkspace(res.data[0]);
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
}));
