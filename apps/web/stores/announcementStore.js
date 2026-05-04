import { create } from 'zustand';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { addPendingId, removePendingId } from './optimistic';

export const useAnnouncementStore = create((set, get) => ({
  announcements: [],
  nextCursor: null,
  pendingIds: new Set(),

  fetchAnnouncements: async (workspaceId, cursor = null) => {
    try {
      const res = await api.get(`/workspaces/${workspaceId}/announcements`, {
        params: { cursor },
      });
      set((state) => ({
        announcements: cursor ? [...state.announcements, ...res.data.data] : res.data.data,
        nextCursor: res.data.nextCursor,
      }));
    } catch (error) {
      throw error;
    }
  },

  addAnnouncement: async (workspaceId, content, attachmentUrl = null) => {
    try {
      const res = await api.post(`/workspaces/${workspaceId}/announcements`, { content, attachmentUrl });
      set((state) => ({ announcements: [res.data, ...state.announcements] }));
    } catch (error) {
      toast.error('Failed to post announcement.');
      throw error;
    }
  },

  prependAnnouncement: (announcement) => {
    set((state) => ({
      announcements: [announcement, ...state.announcements]
    }));
  },

  addReaction: async (workspaceId, announcementId, emoji, userId) => {
    const originalAnnouncements = get().announcements;
    
    // Step 1: Immediate mutation
    set((state) => ({
      announcements: state.announcements.map((a) => {
        if (a.id === announcementId) {
          const reactions = a.reactions || [];
          const exists = reactions.find((r) => r.emoji === emoji && r.userId === userId);
          const newReactions = exists
            ? reactions.filter((r) => r !== exists)
            : [...reactions, { emoji, userId }];
          return { ...a, reactions: newReactions, isPending: true };
        }
        return a;
      }),
      pendingIds: addPendingId(state.pendingIds, `${announcementId}-${emoji}`)
    }));

    try {
      // Step 2: API call
      await api.post(`/workspaces/${workspaceId}/announcements/${announcementId}/reactions`, { emoji });
      
      // Step 3: Success reconciliation
      set((state) => {
        return {
          announcements: state.announcements.map((a) => 
            a.id === announcementId ? { ...a, isPending: false } : a
          ),
          pendingIds: removePendingId(state.pendingIds, `${announcementId}-${emoji}`),
        };
      });
    } catch (error) {
      // Step 3: Error rollback
      set((state) => {
        return {
          announcements: originalAnnouncements,
          pendingIds: removePendingId(state.pendingIds, `${announcementId}-${emoji}`),
        };
      });
      toast.error('Failed to update reaction.');
      throw error;
    }
  },

  toggleReaction: async (...args) => {
    try {
      return await get().addReaction(...args);
    } catch (error) {
      throw error;
    }
  },

  deleteAnnouncement: (announcementId) => {
    set((state) => ({
      announcements: state.announcements.filter(a => a.id !== announcementId)
    }));
  },

  updateReactions: (announcementId, reactions) => {
    set((state) => ({
      announcements: state.announcements.map(a =>
        a.id === announcementId ? { ...a, reactions } : a
      )
    }));
  },

  addComment: async (workspaceId, announcementId, content, user) => {
    const originalAnnouncements = get().announcements;
    const tempId = `temp-comment-${Date.now()}`;
    const newComment = { 
      id: tempId, 
      content, 
      author: user, 
      createdAt: new Date().toISOString(),
      isPending: true 
    };


    // Step 1: Immediate mutation
    set((state) => ({
      announcements: state.announcements.map((a) => 
        a.id === announcementId 
          ? { ...a, comments: [...(a.comments || []), newComment], _count: { ...a._count, comments: (a._count?.comments || 0) + 1 } }
          : a
      ),
      pendingIds: addPendingId(state.pendingIds, tempId)
    }));

    try {
      // Step 2: API call
      const res = await api.post(`/workspaces/${workspaceId}/announcements/${announcementId}/comments`, { content });
      
      // Step 3: Success reconciliation
      set((state) => {
        return {
          announcements: state.announcements.map((a) => 
            a.id === announcementId 
              ? { ...a, comments: a.comments.map(c => c.id === tempId ? res.data : c) }
              : a
          ),
          pendingIds: removePendingId(state.pendingIds, tempId),
        };
      });
    } catch (error) {
      // Step 3: Error rollback
      set((state) => {
        return {
          announcements: originalAnnouncements,
          pendingIds: removePendingId(state.pendingIds, tempId),
        };
      });
      toast.error('Failed to post comment.');
      throw error;
    }
  }
}));
