import { create } from 'zustand';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { addPendingId, removePendingId } from './optimistic';

export const useGoalStore = create((set, get) => ({
  goals: [],
  nextCursor: null,
  pendingIds: new Set(),

  fetchGoals: async (workspaceId, cursor = null) => {
    try {
      const res = await api.get(`/workspaces/${workspaceId}/goals`, {
        params: { cursor },
      });
      set((state) => ({
        goals: cursor ? [...state.goals, ...res.data.data] : res.data.data,
        nextCursor: res.data.nextCursor,
      }));
    } catch (error) {
      throw error;
    }
  },

  addGoal: async (workspaceId, goalData) => {
    const tempId = `temp-${Date.now()}`;
    const newGoal = { ...goalData, id: tempId, status: 'NOT_STARTED', isPending: true };
    
    // Step 1: Immediate mutation
    set((state) => ({ 
      goals: [newGoal, ...state.goals],
      pendingIds: addPendingId(state.pendingIds, tempId)
    }));

    try {
      // Step 2: API call
      const res = await api.post(`/workspaces/${workspaceId}/goals`, goalData);
      
      // Step 3: Success reconciliation
      set((state) => {
        return {
          goals: state.goals.map((g) => (g.id === tempId ? { ...res.data, isPending: false } : g)),
          pendingIds: removePendingId(state.pendingIds, tempId),
        };
      });
    } catch (error) {
      // Step 3: Error rollback
      set((state) => {
        return {
          goals: state.goals.filter((g) => g.id !== tempId),
          pendingIds: removePendingId(state.pendingIds, tempId),
        };
      });
      toast.error('Failed to create goal. Please try again.');
      throw error;
    }
  },

  updateGoalStatus: async (workspaceId, goalId, status) => {
    const originalGoals = get().goals;
    
    // Step 1: Immediate mutation
    set((state) => ({
      goals: state.goals.map((g) => (g.id === goalId ? { ...g, status, isPending: true } : g)),
      pendingIds: addPendingId(state.pendingIds, goalId)
    }));

    try {
      // Step 2: API call
      await api.patch(`/workspaces/${workspaceId}/goals/${goalId}`, { status });
      
      // Step 3: Success reconciliation
      set((state) => {
        return {
          goals: state.goals.map((g) => (g.id === goalId ? { ...g, isPending: false } : g)),
          pendingIds: removePendingId(state.pendingIds, goalId),
        };
      });
    } catch (error) {
      // Step 3: Error rollback
      set((state) => {
        return {
          goals: originalGoals,
          pendingIds: removePendingId(state.pendingIds, goalId),
        };
      });
      toast.error('Failed to update goal status.');
      throw error;
    }
  },

  deleteGoal: async (workspaceId, goalId) => {
    const originalGoals = get().goals;
    set((state) => ({ 
      goals: state.goals.filter((g) => g.id !== goalId),
      pendingIds: addPendingId(state.pendingIds, goalId)
    }));

    try {
      await api.delete(`/workspaces/${workspaceId}/goals/${goalId}`);
      set((state) => {
        return { pendingIds: removePendingId(state.pendingIds, goalId) };
      });
    } catch (error) {
      set((state) => {
        return {
          goals: originalGoals,
          pendingIds: removePendingId(state.pendingIds, goalId),
        };
      });
      toast.error('Failed to delete goal.');
      throw error;
    }
  },
}));
