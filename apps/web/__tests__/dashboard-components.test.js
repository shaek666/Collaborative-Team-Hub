import React from 'react';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GoalsPage from '../app/(dashboard)/workspace/[id]/goals/page';
import AnnouncementsPage from '../app/(dashboard)/workspace/[id]/announcements/page';
import ActionItemsPage from '../app/(dashboard)/workspace/[id]/action-items/page';
import DashboardLayout from '../app/(dashboard)/layout';
import { useGoalStore } from '../stores/goalStore';
import { useAnnouncementStore } from '../stores/announcementStore';
import { useActionItemStore } from '../stores/actionItemStore';
import { useAuthStore } from '../stores/authStore';
import { useWorkspaceStore } from '../stores/workspaceStore';
import { useNotificationStore } from '../stores/notificationStore';
import { useParams, usePathname, useRouter } from 'next/navigation';

let mockDragEndHandler;
const mockSocket = {
  emit: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
};

jest.mock('../lib/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('../stores/goalStore', () => ({
  useGoalStore: jest.fn(),
}));

jest.mock('../stores/announcementStore', () => ({
  useAnnouncementStore: jest.fn(),
}));

jest.mock('../stores/actionItemStore', () => ({
  useActionItemStore: jest.fn(),
}));

jest.mock('../stores/authStore', () => ({
  useAuthStore: jest.fn(),
}));

jest.mock('../stores/workspaceStore', () => ({
  useWorkspaceStore: jest.fn(),
}));

jest.mock('../stores/notificationStore', () => ({
  useNotificationStore: jest.fn(),
}));

jest.mock('../lib/socket', () => ({
  getSocket: jest.fn(() => mockSocket),
  connectSocket: jest.fn(),
  disconnectSocket: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  usePathname: jest.fn(),
  useRouter: jest.fn(),
}));

jest.mock('next/link', () => {
  const React = require('react');

  return {
    __esModule: true,
    default: ({ href, children, ...props }) => (
      <a href={typeof href === 'string' ? href : '#'} {...props}>
        {children}
      </a>
    ),
  };
});

jest.mock('react-hot-toast', () => {
  const toast = jest.fn();
  toast.success = jest.fn();
  toast.error = jest.fn();
  return {
    __esModule: true,
    default: toast,
  };
}, { virtual: true });

jest.mock('date-fns', () => ({
  format: jest.fn(() => 'May 1, 2026'),
}), { virtual: true });

jest.mock('framer-motion', () => {
  const React = require('react');

  return {
    AnimatePresence: ({ children }) => <>{children}</>,
    motion: {
      div: ({
        children,
        initial,
        animate,
        exit,
        transition,
        layout,
        ...props
      }) => <div {...props}>{children}</div>,
    },
  };
}, { virtual: true });

jest.mock('@hello-pangea/dnd', () => {
  const React = require('react');

  return {
    __getDragEndHandler: () => mockDragEndHandler,
    DragDropContext: ({ children, onDragEnd }) => {
      mockDragEndHandler = onDragEnd;
      return <div data-testid="drag-drop-context">{children}</div>;
    },
    Droppable: ({ children, droppableId }) => (
      <div data-testid={`droppable-${droppableId}`}>
        {children(
          {
            droppableProps: {},
            innerRef: jest.fn(),
            placeholder: null,
          },
          { isDraggingOver: false }
        )}
      </div>
    ),
    Draggable: ({ children, draggableId }) => (
      <div data-testid={`draggable-${draggableId}`}>
        {children(
          {
            draggableProps: { style: {} },
            dragHandleProps: {},
            innerRef: jest.fn(),
          },
          { isDragging: false }
        )}
      </div>
    ),
  };
}, { virtual: true });

const useMockStore = (hook, state) => {
  hook.mockImplementation((selector) => (typeof selector === 'function' ? selector(state) : state));
};

const reactionButton = (emoji) =>
  screen.getAllByRole('button').find((button) => button.textContent.includes(emoji));

describe('Goal card component', () => {
  it('renders title, status badge, progress bar, and status colours', async () => {
    useParams.mockReturnValue({ id: 'workspace-1' });
    useMockStore(useGoalStore, {
      goals: [
        {
          id: 'goal-1',
          title: 'Launch redesign',
          status: 'IN_PROGRESS',
          dueDate: null,
          owner: { name: 'Avery' },
          milestones: [
            { id: 'm1', completed: true },
            { id: 'm2', completed: true },
            { id: 'm3', completed: false },
            { id: 'm4', completed: false },
          ],
          _count: { milestones: 4 },
        },
        {
          id: 'goal-2',
          title: 'Close beta feedback',
          status: 'COMPLETED',
          dueDate: null,
          owner: { name: 'Sam' },
          milestones: [],
          _count: { milestones: 0 },
        },
        {
          id: 'goal-3',
          title: 'Fix overdue blockers',
          status: 'OVERDUE',
          dueDate: null,
          owner: { name: 'Riley' },
          milestones: [],
          _count: { milestones: 0 },
        },
        {
          id: 'goal-4',
          title: 'Plan next cycle',
          status: 'NOT_STARTED',
          dueDate: null,
          owner: { name: 'Jordan' },
          milestones: [],
          _count: { milestones: 0 },
        },
      ],
      goalUpdates: {},
      fetchGoals: jest.fn().mockResolvedValue(undefined),
      addGoal: jest.fn(),
      updateGoalStatus: jest.fn(),
      pendingIds: new Set(),
    });

    render(<GoalsPage />);

    expect(await screen.findByText('Launch redesign')).toBeInTheDocument();
    expect(screen.getByText('IN_PROGRESS')).toHaveClass('text-blue-500');
    expect(screen.getByText('COMPLETED')).toHaveClass('text-emerald-500');
    expect(screen.getByText('OVERDUE')).toHaveClass('text-rose-500');
    expect(screen.getByText('NOT_STARTED')).toHaveClass('text-slate-300');

    const progressBar = screen.getByRole('progressbar', {
      name: /launch redesign milestone progress/i,
    });
    expect(progressBar).toHaveAttribute('aria-valuenow', '50');
    expect(progressBar).toHaveStyle({ width: '50%' });
    expect(screen.getByText('50%')).toBeInTheDocument();
  });
});

describe('Announcement feed item', () => {
  it('renders content, author, reaction counts, reaction clicks, and pin indicator', async () => {
    const user = userEvent.setup();
    const mockAddReaction = jest.fn();

    useParams.mockReturnValue({ id: 'workspace-1' });
    useMockStore(useAuthStore, {
      user: { id: 'user-1', name: 'Nora', email: 'nora@example.com' },
    });
    useMockStore(useWorkspaceStore, { members: [] });
    useMockStore(useAnnouncementStore, {
      announcements: [
        {
          id: 'announcement-1',
          content: 'Release notes are ready for review.',
          author: { name: 'Mina' },
          createdAt: '2026-05-01T10:00:00.000Z',
          isPinned: true,
          reactions: [
            { emoji: '🚀', userId: 'user-2' },
            { emoji: '🚀', userId: 'user-3' },
            { emoji: '🔥', userId: 'user-1' },
          ],
          _count: { comments: 2 },
        },
      ],
      fetchAnnouncements: jest.fn().mockResolvedValue(undefined),
      addAnnouncement: jest.fn(),
      addReaction: mockAddReaction,
      addComment: jest.fn(),
      pendingIds: new Set(),
    });

    render(<AnnouncementsPage />);

    expect(await screen.findByText('Release notes are ready for review.')).toBeInTheDocument();
    expect(screen.getByText('Mina')).toBeInTheDocument();
    expect(reactionButton('🚀')).toHaveTextContent('2');
    expect(reactionButton('🔥')).toHaveTextContent('1');
    expect(screen.getByLabelText(/pinned announcement/i)).toBeInTheDocument();

    await user.click(reactionButton('🚀'));

    expect(mockAddReaction).toHaveBeenCalledWith(
      'workspace-1',
      'announcement-1',
      '🚀',
      'user-1'
    );
  });
});

describe('Kanban board', () => {
  it('renders status columns, places items by status, and calls updateItemStatus on drag', async () => {
    const mockUpdateItemStatus = jest.fn();
    useParams.mockReturnValue({ id: 'workspace-1' });
    useMockStore(useActionItemStore, {
      items: [
        {
          id: 'item-1',
          title: 'Draft launch checklist',
          status: 'TODO',
          priority: 'MEDIUM',
          assignee: { name: 'Avery' },
        },
        {
          id: 'item-2',
          title: 'Build dashboard filters',
          status: 'IN_PROGRESS',
          priority: 'HIGH',
          assignee: { name: 'Sam' },
        },
        {
          id: 'item-3',
          title: 'Review onboarding copy',
          status: 'IN_REVIEW',
          priority: 'LOW',
          assignee: { name: 'Mina' },
        },
        {
          id: 'item-4',
          title: 'Ship workspace switcher',
          status: 'DONE',
          priority: 'URGENT',
          assignee: { name: 'Nora' },
        },
      ],
      fetchItems: jest.fn().mockResolvedValue(undefined),
      updateItemStatus: mockUpdateItemStatus,
      pendingIds: new Set(),
    });

    render(<ActionItemsPage />);

    const todoColumn = await screen.findByRole('region', { name: 'TODO column' });
    const inProgressColumn = screen.getByRole('region', { name: 'IN_PROGRESS column' });
    const inReviewColumn = screen.getByRole('region', { name: 'IN_REVIEW column' });
    const doneColumn = screen.getByRole('region', { name: 'DONE column' });

    expect([todoColumn, inProgressColumn, inReviewColumn, doneColumn]).toHaveLength(4);
    expect(within(todoColumn).getByText('Draft launch checklist')).toBeInTheDocument();
    expect(within(inProgressColumn).getByText('Build dashboard filters')).toBeInTheDocument();
    expect(within(inReviewColumn).getByText('Review onboarding copy')).toBeInTheDocument();
    expect(within(doneColumn).getByText('Ship workspace switcher')).toBeInTheDocument();
    expect(within(doneColumn).queryByText('Draft launch checklist')).not.toBeInTheDocument();

    let resolveUpdate;
    mockUpdateItemStatus.mockImplementationOnce(
      () => new Promise((resolve) => {
        resolveUpdate = resolve;
      })
    );

    const dragEnd = require('@hello-pangea/dnd').__getDragEndHandler();
    const dragPromise = dragEnd({
      draggableId: 'item-1',
      source: { droppableId: 'TODO', index: 0 },
      destination: { droppableId: 'DONE', index: 0 },
    });

    expect(mockUpdateItemStatus).toHaveBeenCalledWith('workspace-1', 'item-1', 'DONE');

    resolveUpdate();
    await act(async () => {
      await dragPromise;
    });
  });
});

describe('Notification bell', () => {
  it('shows unread badge and removes it after marking all as read', async () => {
    const user = userEvent.setup();
    const mockMarkAllAsRead = jest.fn().mockResolvedValue(undefined);
    let notificationState = {
      notifications: [
        { id: 'notification-1' },
        { id: 'notification-2' },
        { id: 'notification-3' },
      ],
      fetchNotifications: jest.fn().mockResolvedValue(undefined),
      addNotification: jest.fn(),
      markAllAsRead: mockMarkAllAsRead,
    };

    usePathname.mockReturnValue('/dashboard');
    useRouter.mockReturnValue({ push: jest.fn() });
    useMockStore(useAuthStore, {
      user: { id: 'user-1', name: 'Nora', email: 'nora@example.com' },
      isAuthenticated: true,
      isLoading: false,
      fetchMe: jest.fn().mockResolvedValue(undefined),
      logout: jest.fn(),
    });
    useMockStore(useWorkspaceStore, {
      workspaces: [{ id: 'ws-1', name: 'Test', accentColour: '#3b82f6' }],
      activeWorkspace: { id: 'ws-1', name: 'Test', accentColour: '#3b82f6' },
      fetchWorkspaces: jest.fn().mockResolvedValue(undefined),
      setActiveWorkspace: jest.fn(),
      setOnlineMembers: jest.fn(),
    });
    useNotificationStore.mockImplementation(() => notificationState);

    const { rerender } = render(
      <DashboardLayout>
        <div>Dashboard content</div>
      </DashboardLayout>
    );

    // Wait for auth check to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    expect(screen.getByRole('status', { name: '3 unread notifications' })).toHaveTextContent('3');

    await user.click(screen.getByRole('button', { name: /notifications/i }));
    expect(mockMarkAllAsRead).toHaveBeenCalledTimes(1);

    notificationState = {
      ...notificationState,
      notifications: [],
    };
    rerender(
      <DashboardLayout>
        <div>Dashboard content</div>
      </DashboardLayout>
    );

    await waitFor(() => {
      expect(screen.queryByRole('status', { name: /unread notifications/i })).not.toBeInTheDocument();
    });
  });
});
