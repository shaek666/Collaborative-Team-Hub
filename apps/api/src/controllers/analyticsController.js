import prisma from '../lib/prisma.js';

export const getAnalytics = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Batch count queries using Prisma aggregations
    const [totalGoals, completedThisWeek, overdueCount] = await Promise.all([
      prisma.goal.count({ where: { workspaceId: id } }),
      prisma.goal.count({
        where: { 
          workspaceId: id, 
          status: 'COMPLETED',
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      }),
      prisma.goal.count({
        where: { workspaceId: id, status: 'OVERDUE' }
      })
    ]);

    // Group by status for more detailed analytics if needed
    const goalsByStatus = await prisma.goal.groupBy({
      by: ['status'],
      where: { workspaceId: id },
      _count: true
    });

    // Mock completion chart data - in production, this could be a groupBy on createdAt
    const chartData = [
      { name: 'Mon', completed: 2 },
      { name: 'Tue', completed: 5 },
      { name: 'Wed', completed: 3 },
      { name: 'Thu', completed: 8 },
      { name: 'Fri', completed: 6 },
    ];

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
