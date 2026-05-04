import { create } from 'zustand';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { addPendingId, removePendingId } from './optimistic';

export const useActionItemStore = create((set, get) => ({
  items: [],
  nextCursor: null,
  pendingIds: new Set(),

  fetchItems: async (workspaceId, status = null, cursor = null) => {
    try {
      const res = await api.get(`/workspaces/${workspaceId}/action-items`, {
        params: { status, cursor },
      });
      set((state) => ({
        items: cursor ? [...state.items, ...res.data.data] : res.data.data,
        nextCursor: res.data.nextCursor,
      }));
    } catch (error) {
      throw error;
    }
  },

  updateItemStatus: async (workspaceId, itemId, status) => {
    const originalItems = get().items;
    
    // Step 1: Immediate mutation
    set((state) => ({
      items: state.items.map((item) =>
        item.id === itemId ? { ...item, status, isPending: true } : item
      ),
      pendingIds: addPendingId(state.pendingIds, itemId)
    }));

    try {
      // Step 2: API call
      await api.patch(`/workspaces/${workspaceId}/action-items/${itemId}`, { status });
      
      // Step 3: Success reconciliation
      set((state) => {
        return {
          items: state.items.map((item) => 
            item.id === itemId ? { ...item, isPending: false } : item
          ),
          pendingIds: removePendingId(state.pendingIds, itemId),
        };
      });
    } catch (error) {
      // Step 3: Error rollback
      set((state) => {
        return {
          items: originalItems,
          pendingIds: removePendingId(state.pendingIds, itemId),
        };
      });
      toast.error('Failed to move item.');
      throw error;
    }
  },

  createItem: async (workspaceId, data) => {
    try {
      const payload = {
        ...data,
        assigneeId: data.assigneeId || undefined,
        dueDate: data.dueDate || undefined,
        goalId: data.goalId || undefined,
      };
      const res = await api.post(`/workspaces/${workspaceId}/action-items`, payload);
      set((state) => ({
        items: [res.data, ...state.items],
      }));
      return res.data;
    } catch (error) {
      throw error;
    }
  },
}));
