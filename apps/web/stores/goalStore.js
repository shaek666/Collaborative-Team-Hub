import { create } from 'zustand';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { addPendingId, removePendingId } from './optimistic';

export const useGoalStore = create((set, get) => ({
  goals: [],
  goalUpdates: {}, // Map<goalId, updates[]>
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

  fetchGoalUpdates: async (workspaceId, goalId) => {
    try {
      const res = await api.get(`/workspaces/${workspaceId}/goals/${goalId}/updates`);
      set((state) => ({
        goalUpdates: { ...state.goalUpdates, [goalId]: res.data },
      }));
    } catch (error) {
      throw error;
    }
  },

  addGoalUpdate: async (workspaceId, goalId, content) => {
    try {
      const res = await api.post(`/workspaces/${workspaceId}/goals/${goalId}/updates`, { content });
      set((state) => {
        const existing = state.goalUpdates[goalId] || [];
        return {
          goalUpdates: { ...state.goalUpdates, [goalId]: [res.data, ...existing] },
        };
      });
      return res.data;
    } catch (error) {
      toast.error('Failed to post update.');
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

  addMilestone: async (workspaceId, goalId, milestoneData) => {
    try {
      const res = await api.post(`/workspaces/${workspaceId}/goals/${goalId}/milestones`, milestoneData);
      set((state) => ({
        goals: state.goals.map((g) => {
          if (g.id === goalId) {
            const newStatus = g.status === 'NOT_STARTED' ? 'IN_PROGRESS' : g.status;
            return { 
              ...g, 
              milestones: [...(g.milestones || []), res.data],
              status: newStatus
            };
          }
          return g;
        }),
      }));
      return res.data;
    } catch (error) {
      toast.error('Failed to add milestone.');
      throw error;
    }
  },

  toggleMilestone: async (workspaceId, goalId, milestoneId) => {
    const originalGoals = get().goals;
    // Optimistic update
    set((state) => {
      const updatedGoals = state.goals.map((g) => {
        if (g.id === goalId) {
          const updatedMilestones = g.milestones?.map((m) =>
            m.id === milestoneId ? { ...m, completed: !m.completed } : m
          ) || [];
          
          // Auto-calculate goal status based on milestones
          const totalMilestones = updatedMilestones.length;
          let newStatus = g.status;
          
          if (totalMilestones > 0) {
            const completedCount = updatedMilestones.filter(m => m.completed).length;
            
            if (completedCount === totalMilestones) {
              newStatus = 'COMPLETED';
            } else if (completedCount > 0) {
              newStatus = 'IN_PROGRESS';
            } else {
              newStatus = 'NOT_STARTED';
            }
          }
          
          return {
            ...g,
            milestones: updatedMilestones,
            status: newStatus,
          };
        }
        return g;
      });
      return { goals: updatedGoals };
    });

    try {
      const goal = originalGoals.find((g) => g.id === goalId);
      const milestone = goal?.milestones?.find((m) => m.id === milestoneId);
      const completed = !milestone?.completed;
      
      // Update milestone
      await api.patch(
        `/workspaces/${workspaceId}/goals/${goalId}/milestones/${milestoneId}`,
        { completed }
      );
      
      // Recalculate and update goal status
      const updatedGoal = get().goals.find((g) => g.id === goalId);
      if (updatedGoal && updatedGoal.status !== goal?.status) {
        await api.patch(`/workspaces/${workspaceId}/goals/${goalId}`, { status: updatedGoal.status });
      }
    } catch (error) {
      // Rollback
      set({ goals: originalGoals });
      toast.error('Failed to update milestone.');
    }
  },

  updateGoalInStore: (updatedGoal) => {
    set((state) => ({
      goals: state.goals.map((g) => 
        g.id === updatedGoal.id ? { ...g, ...updatedGoal } : g
      ),
    }));
  },
}));
