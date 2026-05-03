'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useGoalStore } from '../../../../../stores/goalStore';
import { Card, CardContent } from '../../../../../components/ui/Card';
import { Button } from '../../../../../components/ui/Button';
import { Badge } from '../../../../../components/ui/Badge';
import { EmptyState } from '../../../../../components/ui/EmptyState';
import { Input } from '../../../../../components/ui/Input';
import { LoadingState } from '../../../../../components/ui/LoadingState';
import { Modal } from '../../../../../components/ui/Modal';
import { 
  Plus, 
  Calendar, 
  CheckCircle2, 
  ChevronRight,
  Loader2,
  Target,
  Users,
  Send,
  MessageSquare
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../../../lib/utils';
import toast from 'react-hot-toast';
import { getApiErrorMessage } from '../../../../../lib/errors';

export default function GoalsPage() {
  const { id: workspaceId } = useParams();
  const { goals, fetchGoals, fetchGoalUpdates, addGoalUpdate, addGoal, pendingIds, goalUpdates, addMilestone } = useGoalStore();
  const [loading, setLoading] = useState(true);
  const [expandedGoalId, setExpandedGoalId] = useState(null);
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalDueDate, setNewGoalDueDate] = useState('');
  const [newGoalStatus, setNewGoalStatus] = useState('NOT_STARTED');
  const [addingGoal, setAddingGoal] = useState(false);
  const [updateContent, setUpdateContent] = useState('');
  const [postingUpdate, setPostingUpdate] = useState(false);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [isAddingMilestone, setIsAddingMilestone] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        await fetchGoals(workspaceId);
      } catch (error) {
        toast.error(getApiErrorMessage(error, 'Failed to load goals'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [workspaceId, fetchGoals]);

  useEffect(() => {
    if (expandedGoalId) {
      fetchGoalUpdates(workspaceId, expandedGoalId);
    }
  }, [expandedGoalId, workspaceId, fetchGoalUpdates]);

  const handleAddGoal = async (e) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;

    setAddingGoal(true);
    try {
      const payload = { title: newGoalTitle.trim() };
      if (newGoalDueDate) payload.dueDate = new Date(newGoalDueDate);
      if (newGoalStatus) payload.status = newGoalStatus;
      await addGoal(workspaceId, payload);
      setNewGoalTitle('');
      setNewGoalDueDate('');
      setNewGoalStatus('NOT_STARTED');
      setIsAddGoalOpen(false);
    } catch {
    } finally {
      setAddingGoal(false);
    }
  };

  const handlePostUpdate = async (e) => {
    e.preventDefault();
    if (!updateContent.trim() || !expandedGoalId) return;

    setPostingUpdate(true);
    try {
      await addGoalUpdate(workspaceId, expandedGoalId, updateContent.trim());
      setUpdateContent('');
    } catch {
    } finally {
      setPostingUpdate(false);
    }
  };

  const handleAddMilestone = async (goalId) => {
    if (!newMilestoneTitle.trim()) return;
    setIsAddingMilestone(goalId);
    try {
      await addMilestone(workspaceId, goalId, { title: newMilestoneTitle.trim() });
      setNewMilestoneTitle('');
    } catch {
    } finally {
      setIsAddingMilestone(null);
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'COMPLETED': return 'success';
      case 'IN_PROGRESS': return 'info';
      case 'OVERDUE': return 'danger';
      default: return 'secondary';
    }
  };

  const getMilestoneProgress = (goal) => {
    const totalMilestones = goal._count?.milestones || goal.milestones?.length || 0;
    if (totalMilestones === 0) return 0;

    const completedMilestones = goal.milestones?.filter((milestone) => milestone.completed).length || 0;
    return Math.round((completedMilestones / totalMilestones) * 100);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Goals</h1>
          <p className="text-slate-400">Track and manage your team&apos;s objectives.</p>
        </div>
        <Button onClick={() => setIsAddGoalOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Goal
        </Button>
      </div>

      <Modal
        isOpen={isAddGoalOpen}
        title="Add Goal"
        description="Create a team objective to track milestones and progress."
        onClose={() => setIsAddGoalOpen(false)}
      >
        <form onSubmit={handleAddGoal} className="space-y-4">
          <Input
            autoFocus
            value={newGoalTitle}
            onChange={(e) => setNewGoalTitle(e.target.value)}
            placeholder="Goal title"
            className="bg-slate-950/50 border-slate-800"
          />
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-400">Due Date</label>
            <Input
              type="date"
              value={newGoalDueDate}
              onChange={(e) => setNewGoalDueDate(e.target.value)}
              className="bg-slate-950/50 border-slate-800"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-400">Status</label>
            <select
              value={newGoalStatus}
              onChange={(e) => setNewGoalStatus(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="NOT_STARTED">Not Started</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="OVERDUE">Overdue</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setIsAddGoalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addingGoal || !newGoalTitle.trim()}>
              {addingGoal ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Goal'}
            </Button>
          </div>
        </form>
      </Modal>

      {loading ? (
        <LoadingState label="Loading goals" />
      ) : goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No goals yet"
          description="Create the first goal for this workspace."
          action={(
            <Button onClick={() => setIsAddGoalOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Goal
            </Button>
          )}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence mode="popLayout">
            {goals.map((goal) => {
              const milestoneProgress = getMilestoneProgress(goal);
              const updates = goalUpdates[goal.id] || [];

              return (
                <motion.div
                  key={goal.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Card 
                    className={cn(
                      "border-slate-800/50 hover:border-slate-700 transition-all cursor-pointer group",
                      pendingIds.has(goal.id) && "opacity-60 grayscale-[0.5]"
                    )}
                    onClick={() => setExpandedGoalId(expandedGoalId === goal.id ? null : goal.id)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors",
                            goal.status === 'COMPLETED' ? "bg-emerald-500/10 text-emerald-500" : "bg-blue-500/10 text-blue-500"
                          )}>
                            {goal.status === 'COMPLETED' ? <CheckCircle2 /> : <Target />}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg">{goal.title}</h3>
                              {pendingIds.has(goal.id) && <Loader2 className="w-3 h-3 animate-spin text-slate-500" />}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-slate-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {goal.dueDate ? format(new Date(goal.dueDate), 'MMM d, yyyy') : 'No deadline'}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="w-3.5 h-3.5" />
                                {goal.owner?.name}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6">
                          <div className="hidden md:block text-right space-y-1">
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Progress</p>
                            <div className="flex items-center gap-3">
                              <div className="w-32 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div 
                                  role="progressbar"
                                  aria-label={`${goal.title} milestone progress`}
                                  aria-valuemin="0"
                                  aria-valuemax="100"
                                  aria-valuenow={milestoneProgress}
                                  className="h-full bg-blue-500 transition-all duration-500" 
                                  style={{ width: `${milestoneProgress}%` }} 
                                />
                              </div>
                              <span className="text-sm font-semibold tabular-nums">
                                {milestoneProgress}%
                              </span>
                            </div>
                          </div>
                          <Badge variant={getStatusVariant(goal.status)}>{goal.status}</Badge>
                          <ChevronRight className={cn(
                            "w-5 h-5 text-slate-500 transition-transform duration-200",
                            expandedGoalId === goal.id && "rotate-90"
                          )} />
                        </div>
                      </div>

                      {/* Expanded Content */}
                      {expandedGoalId === goal.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-6 pt-6 border-t border-slate-800 space-y-6"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                              <h4 className="text-sm font-bold uppercase tracking-widest text-slate-500">Milestones</h4>
                              <div className="space-y-2">
                                {goal.milestones?.map((milestone) => (
                                  <div key={milestone.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/30 border border-slate-700/50">
                                    <input 
                                      type="checkbox" 
                                      checked={milestone.completed} 
                                      className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-600 focus:ring-offset-slate-900"
                                      onChange={() => {}}
                                    />
                                    <span className={cn("text-sm", milestone.completed && "line-through text-slate-500")}>
                                      {milestone.title}
                                    </span>
                                  </div>
                                ))}
                                {isAddingMilestone === goal.id && (
                                  <Input
                                    autoFocus
                                    value={newMilestoneTitle}
                                    onChange={(e) => setNewMilestoneTitle(e.target.value)}
                                    placeholder="Milestone title"
                                    className="bg-slate-950/50 border-slate-800"
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddMilestone(goal.id)}
                                  />
                                )}
                                <Button variant="ghost" size="sm" className="w-full border-dashed border-slate-700 hover:border-slate-600"
                                  onClick={() => {
                                    if (isAddingMilestone === goal.id) {
                                      handleAddMilestone(goal.id);
                                    } else {
                                      setIsAddingMilestone(goal.id);
                                    }
                                  }}
                                >
                                  {isAddingMilestone === goal.id ? (
                                    <>
                                      {isAddingMilestone === goal.id ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : null}
                                      Save Milestone
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="w-4 h-4 mr-2" />
                                      Add Milestone
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                            
                            <div className="space-y-4">
                              <h4 className="text-sm font-bold uppercase tracking-widest text-slate-500">Activity Feed</h4>
                              
                              <form onSubmit={handlePostUpdate} className="flex gap-2">
                                <Input
                                  value={updateContent}
                                  onChange={(e) => setUpdateContent(e.target.value)}
                                  placeholder="Post an update..."
                                  className="bg-slate-950/50 border-slate-800 text-sm"
                                  disabled={postingUpdate}
                                />
                                <Button type="submit" size="sm" disabled={postingUpdate || !updateContent.trim()} aria-label="Post update">
                                  {postingUpdate ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                                </Button>
                              </form>

                              <div className="space-y-3 max-h-64 overflow-y-auto">
                                {updates.length === 0 ? (
                                  <div className="flex items-center gap-2 text-sm text-slate-500 py-4">
                                    <MessageSquare className="w-4 h-4" />
                                    No updates yet. Be the first to post one!
                                  </div>
                                ) : (
                                  updates.map((update) => (
                                    <div key={update.id} className="flex gap-3">
                                      <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex-shrink-0 overflow-hidden">
                                        {update.author?.avatarUrl ? (
                                          <img src={update.author.avatarUrl} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center text-xs font-bold uppercase">
                                            {update.author?.name?.charAt(0)}
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex-1 bg-slate-800/30 rounded-lg p-3">
                                        <p className="text-sm text-slate-200">{update.content}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                          <span className="text-xs text-slate-500 font-medium">{update.author?.name}</span>
                                          <span className="text-xs text-slate-600">•</span>
                                          <span className="text-xs text-slate-500">
                                            {formatDistanceToNow(new Date(update.createdAt), { addSuffix: true })}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
