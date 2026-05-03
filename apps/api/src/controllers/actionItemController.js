import prisma from '../lib/prisma.js';
import { sendError } from '../utils/httpResponses.js';

export const listActionItems = async (req, res, next) => {
  try {
    const { id } = req.params; // workspaceId
    const { status, priority, cursor, limit = 10 } = req.query;

    const actionItems = await prisma.actionItem.findMany({
      where: { 
        workspaceId: id,
        ...(status && { status }),
        ...(priority && { priority })
      },
      take: Number(limit),
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        dueDate: true,
        createdAt: true,
        assignee: {
          select: { name: true, avatarUrl: true }
        },
        goal: {
          select: { id: true, title: true }
        }
      }
    });

    const nextCursor = actionItems.length === Number(limit) ? actionItems[actionItems.length - 1].id : null;

    res.json({ data: actionItems, nextCursor });
  } catch (error) {
    next(error);
  }
};

export const createActionItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, assigneeId, goalId, priority, dueDate } = req.body;
    
    // Verify goal belongs to workspace if provided
    if (goalId) {
      const goal = await prisma.goal.findUnique({
        where: { id: goalId, workspaceId: id }
      });
      if (!goal) return sendError(res, 404, 'Goal not found in this workspace');
    }

    const actionItem = await prisma.actionItem.create({
      data: {
        title,
        workspaceId: id,
        assigneeId,
        goalId,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null
      },
      include: {
        assignee: { select: { name: true, avatarUrl: true } }
      }
    });
    
    req.app.get('io').to(id).emit('actionItem:created', actionItem);
    res.status(201).json(actionItem);
  } catch (error) {
    next(error);
  }
};

export const updateActionItem = async (req, res, next) => {
  try {
    const { id, itemId } = req.params; // id is workspaceId
    const { status, assigneeId, priority } = req.body;
    
    const actionItem = await prisma.actionItem.update({
      where: { 
        id: itemId,
        workspaceId: id // Hardened isolation
      },
      data: { status, assigneeId, priority },
      include: {
        assignee: { select: { name: true, avatarUrl: true } }
      }
    });
    
    req.app.get('io').to(id).emit('actionItem:updated', actionItem);
    res.json(actionItem);
  } catch (error) {
    next(error);
  }
};

export const deleteActionItem = async (req, res, next) => {
  try {
    const { id, itemId } = req.params;
    await prisma.actionItem.delete({ 
      where: { 
        id: itemId,
        workspaceId: id // Hardened isolation
      } 
    });
    
    req.app.get('io').to(id).emit('actionItem:deleted', itemId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
