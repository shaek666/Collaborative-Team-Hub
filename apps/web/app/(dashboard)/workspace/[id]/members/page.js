'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useWorkspaceStore } from '../../../../../stores/workspaceStore';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../../components/ui/Card';
import { Button } from '../../../../../components/ui/Button';
import { Badge } from '../../../../../components/ui/Badge';
import { Input } from '../../../../../components/ui/Input';
import { EmptyState } from '../../../../../components/ui/EmptyState';
import { LoadingState } from '../../../../../components/ui/LoadingState';
import { 
  UserPlus, 
  Search, 
  Shield, 
  ShieldCheck,
  MoreVertical,
  Loader2,
  Users
} from 'lucide-react';
import { cn } from '../../../../../lib/utils';
import api from '../../../../../lib/api';
import toast from 'react-hot-toast';
import { getApiErrorMessage } from '../../../../../lib/errors';

export default function MembersPage() {
  const { id: workspaceId } = useParams();
  const { members, onlineMembers, fetchWorkspaces, setActiveWorkspace, workspaces } = useWorkspaceStore();
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [openMemberMenu, setOpenMemberMenu] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        await fetchWorkspaces();
        // Also refresh the current workspace to get latest members
        const current = workspaces.find((ws) => ws.id === workspaceId);
        if (current) {
          await setActiveWorkspace(current);
        }
      } catch (error) {
        toast.error('Failed to load members');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [workspaceId, fetchWorkspaces, setActiveWorkspace, workspaces]);

  const memberListRef = useRef(null);

  useEffect(() => {
    if (!openMemberMenu) return;
    const handleClickOutside = (event) => {
      if (memberListRef.current && !memberListRef.current.contains(event.target)) {
        setOpenMemberMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMemberMenu]);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setInviting(true);
    try {
      await api.post(`/workspaces/${workspaceId}/invite`, { email: inviteEmail, role: 'MEMBER' });
      toast.success('Invitation sent!');
      setInviteEmail('');
      await fetchWorkspaces();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to send invite'));
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (userId, userName) => {
    if (!confirm(`Remove ${userName} from this workspace?`)) return;
    try {
      await api.delete(`/workspaces/${workspaceId}/members/${userId}`);
      toast.success(`${userName} removed`);
      await fetchWorkspaces();
      const current = workspaces.find((ws) => ws.id === workspaceId);
      if (current) await setActiveWorkspace(current);
      setOpenMemberMenu(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to remove member'));
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Members</h1>
          <p className="text-slate-400">Manage who has access to this workspace.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-slate-800/50 bg-slate-900/30">
            <CardHeader className="border-b border-slate-800/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input 
                  id="member-search"
                  aria-label="Search members"
                  placeholder="Search members..." 
                  className="pl-10 bg-slate-950/50 border-slate-800"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-800" ref={memberListRef}>
                {loading ? (
                  <LoadingState label="Loading members" className="h-40" />
                ) : members.length === 0 ? (
                  <div className="p-4">
                    <EmptyState
                      icon={Users}
                      title="No members yet"
                      description="Invite teammates to collaborate in this workspace."
                    />
                  </div>
                ) : (
                  members
                    .filter(m => 
                      m.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      m.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((member) => {
                    const isOnline = onlineMembers.includes(member.userId);
                    return (
                      <div key={member.userId} className="flex items-center justify-between p-4 hover:bg-slate-800/30 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 overflow-hidden">
                              {member.user?.avatarUrl ? (
                                <img src={member.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs font-bold uppercase">
                                  {member.user?.name?.charAt(0)}
                                </div>
                              )}
                            </div>
                            <div className={cn(
                              "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-slate-900",
                              isOnline ? "bg-emerald-500" : "bg-slate-600"
                            )} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{member.user?.name}</p>
                            <p className="text-xs text-slate-500">{member.user?.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant={member.role === 'ADMIN' ? 'info' : 'secondary'} className="gap-1.5">
                            {member.role === 'ADMIN' ? <ShieldCheck className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                            {member.role}
                          </Badge>
                          <div className="relative">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label={`Options for ${member.user?.name}`} onClick={(e) => { e.stopPropagation(); setOpenMemberMenu(openMemberMenu === member.userId ? null : member.userId); }}>
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                            {openMemberMenu === member.userId && member.role !== 'ADMIN' && (
                              <div className="absolute right-0 top-full mt-1 w-48 bg-slate-900 border border-slate-800 rounded-lg shadow-xl z-50 py-1" onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMember(member.userId, member.user?.name)}
                                  className="w-full text-left px-3 py-2 text-sm text-rose-400 hover:bg-slate-800 transition-colors"
                                >
                                  Remove member
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-slate-800/50 bg-blue-600/[0.02] border-blue-500/10">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-500" />
                Invite Member
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleInvite} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Email Address</label>
                  <Input 
                    type="email" 
                    placeholder="teammate@company.com" 
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="bg-slate-950/50 border-slate-800"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={inviting}>
                  {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Invitation'}
                </Button>
                <p className="text-[10px] text-center text-slate-500 italic">
                  They will receive an email to join this workspace.
                </p>
              </form>
            </CardContent>
          </Card>

          <Card className="border-slate-800/50">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-500">Workspace Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Online Now</span>
                <span className="text-sm font-bold text-emerald-500">{onlineMembers.length} members</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Total Members</span>
                <span className="text-sm font-bold">{members.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
