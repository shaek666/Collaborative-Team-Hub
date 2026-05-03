import prisma from '../lib/prisma.js';
import { sendMentionEmail } from '../lib/email.js';

export const getAnalytics = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Batch count queries using Prisma aggregations
    const [totalGoals, completedThisWeek, overdueCount] = await Promise.all([
      prisma.goal.count({ where: { workspaceId: id } }),
      prisma.goal.count({
        where: { 
          workspaceId: id, 
          status: 'COMPLETED',
          updatedAt: { gte: weekAgo }
        }
      }),
      prisma.goal.count({
        where: { workspaceId: id, status: 'OVERDUE' }
      })
    ]);

    // Group by status for more detailed analytics
    const goalsByStatus = await prisma.goal.groupBy({
      by: ['status'],
      where: { workspaceId: id },
      _count: true
    });

    // Real chart data from goal updates grouped by day
    const updates = await prisma.goalUpdate.findMany({
      where: { goal: { workspaceId: id } },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true }
    });

    const dayMap = {};
    updates.forEach(u => {
      const day = u.createdAt.toLocaleDateString('en-US', { weekday: 'short' });
      dayMap[day] = (dayMap[day] || 0) + 1;
    });

    const chartData = Object.entries(dayMap).map(([name, completed]) => ({ name, completed }));

    res.json({ totalGoals, completedThisWeek, overdueCount, goalsByStatus, chartData });
  } catch (error) {
    next(error);
  }
};

export const exportWorkspaceData = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Stream-like batching for export
    const goals = await prisma.goal.findMany({ 
      where: { workspaceId: id },
      select: { id: true, title: true, status: true, dueDate: true }
    });
    
    const csv = [
      ['ID', 'Title', 'Status', 'Due Date'].join(','),
      ...goals.map(g => [g.id, `"${g.title}"`, g.status, g.dueDate || 'N/A'].join(','))
    ].join('\n');

    res.header('Content-Type', 'text/csv');
    res.attachment(`workspace-${id}-export.csv`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
};

export const getNotifications = async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id, isRead: false },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        message: true,
        createdAt: true,
        workspace: { select: { name: true } }
      }
    });
    res.json(notifications);
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notification = await prisma.notification.update({
      where: { id, userId: req.user.id },
      data: { isRead: true },
      select: { id: true, isRead: true }
    });
    res.json(notification);
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    const result = await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true }
    });

    res.json({ count: result.count });
  } catch (error) {
    next(error);
  }
};

export const createNotification = async (req, res, next) => {
  try {
    const { userId, workspaceId, type, message } = req.body;

    const notification = await prisma.notification.create({
      data: {
        userId,
        workspaceId,
        type,
        message,
      }
    });

    // Send email for @mentions
    if (type === 'MENTION') {
      const mentionedUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true }
      });

      const workspace = workspaceId ? await prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: { name: true }
      }) : null;

      if (mentionedUser && workspace) {
        await sendMentionEmail(
          mentionedUser.email,
          req.user.name,
          message,
          workspace.name
        );
      }
    }

    // Notify via Socket.io if user is online
    const io = req.app.get('io');
    if (io) {
      io.sockets.sockets.forEach((socket) => {
        if (socket.user?.userId === userId) {
          socket.emit('notification:new', {
            id: notification.id,
            type,
            message,
            workspaceId,
          });
        }
      });
    }

    res.status(201).json(notification);
  } catch (error) {
    next(error);
  }
};
