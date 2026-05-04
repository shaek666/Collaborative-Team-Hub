'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useAnnouncementStore } from '../../../../../stores/announcementStore';
import { useAuthStore } from '../../../../../stores/authStore';
import { useWorkspaceStore } from '../../../../../stores/workspaceStore';
import { Card, CardContent } from '../../../../../components/ui/Card';
import { Button } from '../../../../../components/ui/Button';
import { EmptyState } from '../../../../../components/ui/EmptyState';
import { LoadingState } from '../../../../../components/ui/LoadingState';
import { RichTextEditor } from '../../../../../components/ui/RichTextEditor';
import { 
  Pin, 
  MessageCircle, 
  Send,
  MoreVertical,
  Plus,
  SmilePlus,
  Megaphone,
  Paperclip,
  AtSign,
  Image,
  X,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../../../lib/utils';
import toast from 'react-hot-toast';
import { getApiErrorMessage } from '../../../../../lib/errors';
import api from '../../../../../lib/api';

function stripHtml(html) {
  const tmp = typeof document !== 'undefined' ? document.createElement('div') : { textContent: '' };
  tmp.innerHTML = html || '';
  return tmp.textContent || tmp.innerText || '';
}

export default function AnnouncementsPage() {
  const { id: workspaceId } = useParams();
  const { announcements, fetchAnnouncements, addAnnouncement, addReaction, addComment, pendingIds } = useAnnouncementStore();
  const { user } = useAuthStore();
  const { members } = useWorkspaceStore();
  const [loading, setLoading] = useState(true);
  const [newAnnouncement, setNewAnnouncement] = useState('');
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [attachmentUploading, setAttachmentUploading] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState(null);

  // @Mention state
  const [mentionQuery, setMentionQuery] = useState('');
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const commentInputRefs = useRef({});

  const EMOJI_LIST = ['😊', '👍', '🎉', '🚀', '❤️', '🔥', '🙌', '👀', '💯', '✨', '👏', '😎', '🤔', '💪', '🙏', '👋', '🌟', '📌', '🔔', '✅'];

  const handleEmojiSelect = (emoji) => {
    setNewAnnouncement(newAnnouncement + emoji);
    setShowEmojiPicker(false);
  };

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

  useEffect(() => {
    if (!showEmojiPicker) return;
    const handleClick = () => setShowEmojiPicker(false);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [showEmojiPicker]);

  const handlePost = async (e) => {
    e.preventDefault();
    if (!stripHtml(newAnnouncement).trim()) return;
    try {
      await addAnnouncement(workspaceId, newAnnouncement, attachmentUrl);
      setNewAnnouncement('');
      setAttachmentFile(null);
      setAttachmentUrl(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to post announcement'));
    }
  };

  const handleAttachmentChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only images, PDFs, and text files are allowed.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be under 10MB.');
      return;
    }

    setAttachmentFile(file);
    setAttachmentUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

       const res = await api.post(`/workspaces/${workspaceId}/announcements/attachments`, formData);

      setAttachmentUrl(res.data.url);
      toast.success('Attachment uploaded.');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to upload attachment'));
    } finally {
      setAttachmentUploading(false);
    }
  };

  const parseMentions = useCallback((content, wsId) => {
    const mentionRegex = /@([\w\s]+?)(?=\s|$|<|&)/g;
    const mentionedUsers = new Set();
    const memberMap = new Map();
    members.forEach(m => {
      memberMap.set(m.user?.name?.toLowerCase(), m.user);
    });

    let match;
    while ((match = mentionRegex.exec(content)) !== null) {
      const name = match[1].trim().toLowerCase();
      const matchedUser = memberMap.get(name);
      if (matchedUser && matchedUser.id !== user?.id) {
        mentionedUsers.add(matchedUser);
      }
    }
    return mentionedUsers;
  }, [members, user]);

  const handleCommentWithMentions = async (announcementId, content) => {
    try {
      await addComment(workspaceId, announcementId, content, user);

      // Parse and notify mentioned users
      const mentionedUsers = parseMentions(content, workspaceId);
      for (const mentionedUser of mentionedUsers) {
        try {
          await api.post(`/notifications`, {
            userId: mentionedUser.id,
            workspaceId,
            type: 'MENTION',
            message: `${user?.name} mentioned you in a comment.`,
            announcementId,
          });
        } catch {
          // Silently fail notification creation
        }
      }
    } catch {
      toast.error('Failed to post comment.');
    }
  };

  const handleMentionSelect = useCallback((userName, inputRef) => {
    if (!inputRef.current) return;
    const input = inputRef.current;
    const cursorPos = input.selectionStart;
    const textBefore = input.value.substring(0, cursorPos);
    const textAfter = input.value.substring(cursorPos);

    // Find the @ and replace with full username
    const atPos = textBefore.lastIndexOf('@');
    const newText = textBefore.substring(0, atPos) + `@${userName} ` + textAfter;

    input.value = newText;
    input.focus();
    const newPos = atPos + userName.length + 2;
    input.setSelectionRange(newPos, newPos);

    // Store in state so parent can read it
    input.dataset.value = newText;

    setShowMentionDropdown(false);
    setMentionQuery('');
  }, []);

  const handleCommentInput = useCallback((announcementId, e) => {
    const input = e.target;
    const cursorPos = input.selectionStart;
    const textBefore = input.value.substring(0, cursorPos);
    const lastAt = textBefore.lastIndexOf('@');

    if (lastAt !== -1 && lastAt >= textBefore.lastIndexOf(' ')) {
      const query = textBefore.substring(lastAt + 1).toLowerCase();
      const matchingMembers = members.filter(m =>
        m.user?.name?.toLowerCase().includes(query) && m.user?.id !== user?.id
      );

      if (matchingMembers.length > 0 && query.length > 0) {
        const rect = input.getBoundingClientRect();
        setMentionPosition({ top: rect.top - 100, left: rect.left });
        setMentionQuery(query);
        setShowMentionDropdown(true);
        commentInputRefs.current[announcementId] = input;
        return;
      }
    }
    setShowMentionDropdown(false);
  }, [members, user]);

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
            <RichTextEditor
              id="announcement-content"
              value={newAnnouncement}
              onChange={setNewAnnouncement}
              placeholder="What's happening? Share an update with your team..."
              className="border-slate-800"
            />
          </div>
          <div className="px-4 py-3 bg-slate-800/20 border-t border-slate-800 flex items-center justify-between">
            <div className="flex gap-2 items-center">
              <label
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm cursor-pointer transition-colors text-slate-400 hover:bg-slate-800 hover:text-slate-200',
                  attachmentUploading && 'opacity-50 pointer-events-none'
                )}
              >
                {attachmentUploading ? (
                  <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Paperclip className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">Attach</span>
                <input
                  type="file"
                  accept="image/*,.pdf,.txt"
                  className="hidden"
                  onChange={handleAttachmentChange}
                  disabled={attachmentUploading}
                />
              </label>
              {attachmentFile && (
                <div className="flex items-center gap-2 px-2 py-1 bg-blue-600/10 border border-blue-500/30 rounded-lg text-xs text-blue-400">
                  <FileText className="w-3 h-3" />
                  <span className="max-w-[120px] truncate">{attachmentFile.name}</span>
                  <button
                    type="button"
                    onClick={() => { setAttachmentFile(null); setAttachmentUrl(null); }}
                    className="hover:text-blue-300"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
<div className="relative">
                  <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                    <SmilePlus className="w-4 h-4" />
                  </Button>
                  {showEmojiPicker && (
                    <div className="absolute bottom-full left-0 mb-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 w-64 max-h-48 overflow-y-auto p-2">
                      <div className="grid grid-cols-5 gap-1">
                        {EMOJI_LIST.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => handleEmojiSelect(emoji)}
                            className="w-8 h-8 flex items-center justify-center text-lg hover:bg-slate-700 rounded transition-colors"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
            </div>
            <Button type="submit" size="sm" disabled={!stripHtml(newAnnouncement).trim()} className="gap-2">
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
               <AnnouncementCard
                 key={announcement.id}
                 announcement={announcement}
                 user={user}
                 workspaceId={workspaceId}
                 onAddReaction={addReaction}
                 onAddComment={handleCommentWithMentions}
                 isPending={pendingIds.has(announcement.id)}
                 members={members}
                 handleCommentInput={handleCommentInput}
                 commentInputRefs={commentInputRefs}
                 showMentionDropdown={showMentionDropdown}
                 mentionQuery={mentionQuery}
                 mentionPosition={mentionPosition}
                 onMentionSelect={(name) => handleMentionSelect(name, { current: commentInputRefs.current[announcement.id] })}
                  index={i}
                  onDelete={async (announcementId) => {
                    if (!confirm('Delete this announcement?')) return;
                    try {
                      await api.delete(`/workspaces/${workspaceId}/announcements/${announcementId}`);
                      await fetchAnnouncements(workspaceId);
                    } catch (error) {
                      toast.error(getApiErrorMessage(error, 'Failed to delete announcement'));
                    }
                  }}
                />
             ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function AnnouncementCard({ announcement, user, workspaceId, onAddReaction, onAddComment, isPending, members, handleCommentInput, commentInputRefs, showMentionDropdown, mentionQuery, mentionPosition, onMentionSelect, index, onDelete }) {
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);
  const localInputRef = useRef(null);

  useEffect(() => {
    if (!openMenu) return;
    const handleClick = (e) => {
      if (!e.target.closest('[data-announcement-menu]')) {
        setOpenMenu(false);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [openMenu]);

  useEffect(() => {
    if (localInputRef.current) {
      commentInputRefs.current[announcement.id] = localInputRef.current;
    }
  }, [commentInputRefs, announcement.id]);

  const handleSubmitComment = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(announcement.id, commentText);
    setCommentText('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
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
                     <Pin aria-label="Pinned announcement" className="w-3 h-3 text-blue-500 fill-blue-500" />
                   )}
                 </p>
                 <p className="text-xs text-slate-500">
                   {format(new Date(announcement.createdAt), 'MMM d • h:mm a')}
                 </p>
               </div>
             </div>
              <div className="relative">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu ? null : 'menu'); }}>
                  <MoreVertical className="w-4 h-4" />
                </Button>
                {openMenu && (
                  <div data-announcement-menu className="absolute right-0 top-full mt-1 w-40 bg-slate-900 border border-slate-800 rounded-lg shadow-xl z-50 py-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => { setOpenMenu(null); onDelete(announcement.id, announcement.content); }}
                      className="w-full text-left px-3 py-2 text-sm text-rose-400 hover:bg-slate-800 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
           </div>

          <div 
            className="text-slate-200 leading-relaxed prose prose-invert prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: announcement.content }} 
          />

          {announcement.attachmentUrl && (
            <div className="pt-2">
              {announcement.attachmentUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                <img src={announcement.attachmentUrl} alt="Attachment" className="rounded-lg max-h-64 object-cover border border-slate-800" />
              ) : (
                <a href={announcement.attachmentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 rounded-lg border border-slate-700 text-sm text-blue-400 hover:text-blue-300 transition-colors">
                  <FileText className="w-4 h-4" />
                  View Attachment
                </a>
              )}
            </div>
          )}

          <div className="pt-2 flex flex-wrap gap-2">
            {['🚀', '🙌', '👀', '🔥', '❤️'].map((emoji) => {
              const reactions = announcement.reactions?.filter(r => r.emoji === emoji) || [];
              const hasReacted = reactions.some(r => r.userId === user?.id);
              
              return (
                <button
                  key={emoji}
                  onClick={() => onAddReaction(workspaceId, announcement.id, emoji, user?.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-sm transition-all active:scale-90",
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
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-300 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              {announcement._count?.comments || 0} Comments
            </button>
          </div>

          {showComments && (
            <div className="pt-4 border-t border-slate-800 space-y-4">
              <form onSubmit={handleSubmitComment} className="relative">
                <div className="flex gap-2">
                  <input
                    ref={localInputRef}
                    type="text"
                    placeholder="Write a comment... @mention someone"
                    className="flex-1 bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50"
                    value={commentText}
                    onChange={(e) => {
                      setCommentText(e.target.value);
                      handleCommentInput(announcement.id, e);
                    }}
                  />
                  <Button type="submit" size="sm" disabled={!commentText.trim()}>
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                </div>

                {/* Mention Dropdown */}
                {showMentionDropdown && mentionQuery && (
                  <div className="absolute bottom-full left-0 mb-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 w-64 max-h-48 overflow-y-auto">
                    {members
                      .filter(m => m.user?.name?.toLowerCase().includes(mentionQuery) && m.user?.id !== user?.id)
                      .map(m => (
                        <button
                          key={m.user.id}
                          type="button"
                          className="w-full text-left px-3 py-2 text-sm hover:bg-slate-700 transition-colors flex items-center gap-2"
                          onClick={() => onMentionSelect(m.user.name)}
                        >
                          <AtSign className="w-3 h-3 text-slate-400" />
                          <div>
                            <p className="font-medium text-slate-200">{m.user.name}</p>
                            <p className="text-xs text-slate-500">{m.user.email}</p>
                          </div>
                        </button>
                      ))}
                  </div>
                )}
              </form>

              {announcement.comments?.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 overflow-hidden flex-shrink-0">
                    {comment.author?.avatarUrl ? (
                      <img src={comment.author.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] font-bold uppercase">
                        {comment.author?.name?.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 bg-slate-800/30 rounded-lg p-3">
                    <p className="text-xs font-semibold text-slate-300">{comment.author?.name}</p>
                    <p className="text-sm text-slate-200 mt-1">{comment.content}</p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {format(new Date(comment.createdAt), 'MMM d • h:mm a')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
