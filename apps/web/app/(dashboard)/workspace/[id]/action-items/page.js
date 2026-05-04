'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useActionItemStore } from '../../../../../stores/actionItemStore';
import { useAuthStore } from '../../../../../stores/authStore';
import { useWorkspaceStore } from '../../../../../stores/workspaceStore';
import { Card, CardContent } from '../../../../../components/ui/Card';
import { Button } from '../../../../../components/ui/Button';
import { Badge } from '../../../../../components/ui/Badge';
import { Input } from '../../../../../components/ui/Input';
import { EmptyState } from '../../../../../components/ui/EmptyState';
import { LoadingState } from '../../../../../components/ui/LoadingState';
import { 
  Plus, 
  LayoutGrid, 
  List as ListIcon,
  Calendar,
  User,
  MoreVertical,
  Clock,
  X,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { format } from 'date-fns';
import { cn } from '../../../../../lib/utils';
import toast from 'react-hot-toast';
import { getApiErrorMessage } from '../../../../../lib/errors';

const COLUMNS = [
  { id: 'TODO', title: 'To Do', color: 'bg-slate-500' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: 'bg-blue-500' },
  { id: 'IN_REVIEW', title: 'In Review', color: 'bg-amber-500' },
  { id: 'DONE', title: 'Done', color: 'bg-emerald-500' },
];

export default function ActionItemsPage() {
  const { id: workspaceId } = useParams();
  const { items, fetchItems, updateItemStatus, createItem, pendingIds } = useActionItemStore();
  const { user } = useAuthStore();
  const { members } = useWorkspaceStore();
  const [view, setView] = useState('kanban'); // 'kanban' | 'list'
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newItem, setNewItem] = useState({ title: '', description: '', priority: 'MEDIUM', dueDate: '', assigneeId: '' });

  useEffect(() => {
    const load = async () => {
      try {
        await fetchItems(workspaceId);
      } catch (error) {
        toast.error(getApiErrorMessage(error, 'Failed to load action items'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [workspaceId, fetchItems]);

  const handleCreateItem = async (e) => {
    e.preventDefault();
    if (!newItem.title.trim()) return;
    setCreating(true);
    try {
      await createItem(workspaceId, {
        ...newItem,
        assigneeId: newItem.assigneeId || null,
        dueDate: newItem.dueDate || null,
      });
      toast.success('Action item created');
      setNewItem({ title: '', description: '', priority: 'MEDIUM', dueDate: '', assigneeId: '' });
      setShowCreateModal(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to create action item'));
    } finally {
      setCreating(false);
    }
  };

  const onDragEnd = async (result) => {
    const { destination, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === result.source.droppableId) return;

    try {
      await updateItemStatus(workspaceId, draggableId, destination.droppableId);
    } catch {
    }
  };

  const getPriorityVariant = (priority) => {
    switch (priority) {
      case 'URGENT': return 'danger';
      case 'HIGH': return 'warning';
      case 'MEDIUM': return 'info';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Action Items</h1>
          <p className="text-slate-400">Manage and track granular tasks.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-1">
            <button
              onClick={() => setView('kanban')}
              className={cn(
                "p-1.5 rounded-md transition-all",
                view === 'kanban' ? "bg-slate-800 text-blue-500 shadow-sm" : "text-slate-500 hover:text-slate-300"
              )}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
                  <button
              onClick={() => setView('list')}
              className={cn(
                "p-1.5 rounded-md transition-all",
                view === 'list' ? "bg-slate-800 text-blue-500 shadow-sm" : "text-slate-500 hover:text-slate-300"
              )}
              aria-label="Switch to list view"
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            New Item
          </Button>
        </div>
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold">Create Action Item</h2>
                <button onClick={() => setShowCreateModal(false)} className="p-1.5 rounded-lg hover:bg-slate-800">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <form onSubmit={handleCreateItem} className="space-y-4">
                <div>
                  <label htmlFor="action-item-title" className="text-sm font-medium text-slate-300 mb-1 block">Title</label>
                  <Input id="action-item-title" value={newItem.title} onChange={(e) => setNewItem({ ...newItem, title: e.target.value })} placeholder="What needs to be done?" required className="bg-slate-950/50 border-slate-800" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-1 block">Description</label>
                  <textarea value={newItem.description} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} placeholder="Add details..." rows={3} className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-1 block">Priority</label>
                    <select value={newItem.priority} onChange={(e) => setNewItem({ ...newItem, priority: e.target.value })} className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500/50">
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-1 block">Due Date</label>
                    <input type="date" value={newItem.dueDate} onChange={(e) => setNewItem({ ...newItem, dueDate: e.target.value })} className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500/50" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-1 block">Assignee</label>
                  <select value={newItem.assigneeId} onChange={(e) => setNewItem({ ...newItem, assigneeId: e.target.value })} className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500/50">
                    <option value="">Unassigned</option>
                    {members.map(m => (
                      <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
                    ))}
                  </select>
                </div>
                <Button type="submit" className="w-full" disabled={creating || !newItem.title.trim()}>
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
                </Button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <LoadingState label="Loading action items" className="flex-1" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={LayoutGrid}
          title="No action items yet"
          description="Create action items to break goals into trackable work."
        />
      ) : view === 'kanban' ? (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 flex-1 min-h-0 pb-8 overflow-x-auto">
            {COLUMNS.map((column) => (
              <div key={column.id} className="flex flex-col min-w-[280px]">
                <div className="flex items-center justify-between mb-4 px-1">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", column.color)} />
                    <h3 className="font-bold uppercase tracking-widest text-xs text-slate-500">{column.title}</h3>
                    <Badge variant="secondary" className="bg-slate-800/50 text-[10px] h-4 px-1.5">
                      {items.filter(i => i.status === column.id).length}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setShowCreateModal(true)}>
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>

                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      role="region"
                      aria-label={`${column.id} column`}
                      className={cn(
                        "flex-1 rounded-xl p-2 transition-colors space-y-3 min-h-[200px]",
                        snapshot.isDraggingOver ? "bg-slate-900/50 border border-dashed border-slate-800" : "bg-slate-900/20 border border-transparent"
                      )}
                    >
                      {items
                        .filter((item) => item.status === column.id)
                        .map((item, index) => (
                          <Draggable key={item.id} draggableId={item.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={provided.draggableProps.style}
                              >
                                <Card className={cn(
                                  "border-slate-800/50 bg-slate-900 hover:border-slate-700 transition-all shadow-sm",
                                  snapshot.isDragging && "shadow-2xl ring-2 ring-blue-600/50 rotate-2 scale-105",
                                  pendingIds.has(item.id) && "opacity-50 pointer-events-none"
                                )}>
                                  <CardContent className="p-4 space-y-3" role="article" aria-label={`Action item: ${item.title}`}>
                                    <div className="flex items-start justify-between gap-2">
                                      <h4 className="text-sm font-medium leading-tight group-hover:text-blue-400 transition-colors">
                                        {item.title}
                                      </h4>
                                      <button className="text-slate-600 hover:text-slate-400">
                                        <MoreVertical className="w-3.5 h-3.5" />
                                      </button>
                                    </div>

                                    {item.goal && (
                                      <div className="text-[10px] font-bold text-blue-500 uppercase tracking-wider flex items-center gap-1 bg-blue-500/10 px-1.5 py-0.5 rounded w-fit">
                                        <Clock className="w-2.5 h-2.5" />
                                        {item.goal.title}
                                      </div>
                                    )}

                                    <div className="flex items-center justify-between pt-2">
                                      <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden">
                                          {item.assignee?.avatarUrl ? (
                                            <img src={item.assignee.avatarUrl} alt="" className="w-full h-full object-cover" />
                                          ) : (
                                            <User className="w-3 h-3 text-slate-500" />
                                          )}
                                        </div>
                                        <Badge variant={getPriorityVariant(item.priority)} className="text-[10px] px-1.5 py-0">
                                          {item.priority}
                                        </Badge>
                                      </div>
                                      {item.dueDate && (
                                        <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                                          <Calendar className="w-2.5 h-2.5" />
                                          {format(new Date(item.dueDate), 'MMM d')}
                                        </span>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            )}
                          </Draggable>
                        ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      ) : (
        <Card className="border-slate-800/50 bg-slate-900/30 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Task</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Status</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Priority</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Assignee</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4 text-sm font-medium">{item.title}</td>
                    <td className="px-6 py-4">
                      <Badge variant={item.status === 'DONE' ? 'success' : 'secondary'}>{item.status}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={getPriorityVariant(item.priority)}>{item.priority}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center">
                          <User className="w-3 h-3 text-slate-500" />
                        </div>
                        <span className="text-sm">{item.assignee?.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {item.dueDate ? format(new Date(item.dueDate), 'MMM d, yyyy') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
