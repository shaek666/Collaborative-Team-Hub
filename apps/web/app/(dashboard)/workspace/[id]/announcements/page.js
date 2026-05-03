'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAnnouncementStore } from '../../../../../stores/announcementStore';
import { useAuthStore } from '../../../../../stores/authStore';
import { Card, CardContent } from '../../../../../components/ui/Card';
import { Button } from '../../../../../components/ui/Button';
import { EmptyState } from '../../../../../components/ui/EmptyState';
import { LoadingState } from '../../../../../components/ui/LoadingState';
import { 
  Pin, 
  MessageCircle, 
  Send,
  MoreVertical,
  Plus,
  SmilePlus,
  Megaphone
} from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../../../lib/utils';
import toast from 'react-hot-toast';
import { getApiErrorMessage } from '../../../../../lib/errors';

export default function AnnouncementsPage() {
  const { id: workspaceId } = useParams();
  const { announcements, fetchAnnouncements, addAnnouncement, addReaction, addComment, pendingIds } = useAnnouncementStore();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [newAnnouncement, setNewAnnouncement] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        await fetchAnnouncements(workspaceId);
      } catch (error) {
        toast.error(getApiErrorMessage(error, 'Failed to load announcements'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [workspaceId, fetchAnnouncements]);

  const handlePost = async (e) => {
    e.preventDefault();
    if (!newAnnouncement.trim()) return;
    try {
      await addAnnouncement(workspaceId, newAnnouncement);
      setNewAnnouncement('');
    } catch {
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1">Announcements</h1>
        <p className="text-slate-400">Team-wide updates and important notifications.</p>
      </div>

      {/* Post New Announcement */}
      <Card className="border-slate-800/50 bg-slate-900/30 overflow-hidden group focus-within:border-blue-500/50 transition-all">
        <form onSubmit={handlePost}>
          <div className="p-4">
            <textarea
              id="announcement-content"
              aria-label="Write an announcement"
              placeholder="What's happening? @mention someone or share an update..."
              className="w-full bg-transparent border-none focus:ring-0 text-slate-100 placeholder:text-slate-500 resize-none h-24 text-lg"
              value={newAnnouncement}
              onChange={(e) => setNewAnnouncement(e.target.value)}
            />
          </div>
          <div className="px-4 py-3 bg-slate-800/20 border-t border-slate-800 flex items-center justify-between">
            <div className="flex gap-2">
              <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0">
                <SmilePlus className="w-4 h-4" />
              </Button>
            </div>
            <Button type="submit" size="sm" disabled={!newAnnouncement.trim()} className="gap-2">
              <Send className="w-3.5 h-3.5" />
              Post Announcement
            </Button>
          </div>
        </form>
      </Card>

      {loading ? (
        <LoadingState label="Loading announcements" />
      ) : announcements.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No announcements yet"
          description="Post an update to start the workspace feed."
        />
      ) : (
        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {announcements.map((announcement, i) => (
              <motion.div
                key={announcement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className={cn(
                  "border-slate-800/50 relative overflow-hidden",
                  announcement.isPinned && "border-blue-500/30 bg-blue-500/[0.02]"
                )}>
                  {announcement.isPinned && (
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                  )}
                  
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 overflow-hidden">
                          {announcement.author?.avatarUrl ? (
                            <img src={announcement.author.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs font-bold uppercase">
                              {announcement.author?.name?.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold flex items-center gap-2">
                            {announcement.author?.name}
                            {announcement.isPinned && (
                              <Pin
                                aria-label="Pinned announcement"
                                role="img"
                                className="w-3 h-3 text-blue-500 fill-blue-500"
                              />
                            )}
                          </p>
                          <p className="text-xs text-slate-500">
                            {format(new Date(announcement.createdAt), 'MMM d • h:mm a')}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                      {announcement.content}
                    </div>

                    <div className="pt-2 flex flex-wrap gap-2">
                      {/* Emoji Reactions */}
                      {['🚀', '🙌', '👀', '🔥', '❤️'].map((emoji) => {
                        const reactions = announcement.reactions?.filter(r => r.emoji === emoji) || [];
                        const hasReacted = reactions.some(r => r.userId === user?.id);
                        const isPending = pendingIds.has(`${announcement.id}-${emoji}`);
                        
                        return (
                          <button
                            key={emoji}
                            onClick={() => addReaction(workspaceId, announcement.id, emoji, user?.id)}
                            className={cn(
                              "flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-sm transition-all active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900",
                              hasReacted 
                                ? "bg-blue-600/10 border-blue-500/50 text-blue-400" 
                                : "bg-slate-800/30 border-slate-700 hover:border-slate-600 text-slate-400",
                              isPending && "opacity-50 pointer-events-none animate-pulse"
                            )}
                          >
                            <span>{emoji}</span>
                            {reactions.length > 0 && (
                              <span className="font-bold tabular-nums">{reactions.length}</span>
                            )}
                          </button>
                        );
                      })}
                      <Button variant="ghost" size="sm" className="rounded-full h-8 px-3 border border-dashed border-slate-700 text-slate-500">
                        <Plus className="w-3.5 h-3.5 mr-1.5" />
                        Add
                      </Button>
                    </div>

                    <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <MessageCircle className="w-3.5 h-3.5" />
                          {announcement._count?.comments || 0} Comments
                        </div>
                      </div>
                      <button className="text-xs font-bold uppercase tracking-wider text-blue-500 hover:text-blue-400 transition-colors">
                        Reply to announcement
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
