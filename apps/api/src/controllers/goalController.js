import prisma from '../lib/prisma.js';
import { sendError } from '../utils/httpResponses.js';

export const listGoals = async (req, res, next) => {
  try {
    const { id } = req.params; // workspaceId
    const { cursor, limit = 10 } = req.query;

    const goals = await prisma.goal.findMany({
      where: { workspaceId: id },
      take: Number(limit),
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        status: true,
        dueDate: true,
        createdAt: true,
        owner: {
          select: { name: true, avatarUrl: true }
        },
        milestones: {
          select: { id: true, title: true, completed: true, progressPercent: true }
        },
        _count: {
          select: { milestones: true, actionItems: true }
        }
      }
    });

    const nextCursor = goals.length === Number(limit) ? goals[goals.length - 1].id : null;

    res.json({ data: goals, nextCursor });
  } catch (error) {
    next(error);
  }
};

export const createGoal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, dueDate, status } = req.body;
    const goal = await prisma.goal.create({
      data: {
        title,
        workspaceId: id,
        ownerId: req.user.id,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: status || 'NOT_STARTED'
      }
    });
    
    req.app.get('io').to(id).emit('goal:created', goal);
    res.status(201).json(goal);
  } catch (error) {
    next(error);
  }
};

export const updateGoal = async (req, res, next) => {
  try {
    const { goalId, id } = req.params; // id is workspaceId
    const { title, status, dueDate } = req.body;
    
    const goal = await prisma.goal.update({
      where: { 
        id: goalId,
        workspaceId: id // Hardened isolation
      },
      data: { 
        title, 
        status, 
        dueDate: dueDate ? new Date(dueDate) : undefined 
      }
    });
    
    req.app.get('io').to(id).emit('goal:updated', goal);
    res.json(goal);
  } catch (error) {
    next(error);
  }
};

export const deleteGoal = async (req, res, next) => {
  try {
    const { goalId, id } = req.params;
    await prisma.goal.delete({ 
      where: { 
        id: goalId,
        workspaceId: id // Hardened isolation
      } 
    });
    
    req.app.get('io').to(id).emit('goal:deleted', goalId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const addMilestone = async (req, res, next) => {
  try {
    const { goalId, id } = req.params;
    const { title } = req.body;
    
    // Verify goal belongs to workspace first
    const goal = await prisma.goal.findUnique({
      where: { id: goalId, workspaceId: id }
    });
    if (!goal) return sendError(res, 404, 'Goal not found in this workspace');

    const milestone = await prisma.milestone.create({
      data: { goalId, title }
    });
    
    req.app.get('io').to(id).emit('milestone:created', { goalId, milestone });
    res.status(201).json(milestone);
  } catch (error) {
    next(error);
  }
};

export const updateMilestone = async (req, res, next) => {
  try {
    const { milestoneId, id } = req.params;
    const { progressPercent, completed } = req.body;
    
    // Verify milestone belongs to a goal in this workspace via relation
    const milestoneCheck = await prisma.milestone.findFirst({
      where: {
        id: milestoneId,
        goal: { workspaceId: id }
      }
    });
    if (!milestoneCheck) return sendError(res, 404, 'Milestone not found in this workspace');

    const milestone = await prisma.milestone.update({
      where: { id: milestoneId },
      data: { progressPercent, completed }
    });
    
    req.app.get('io').to(id).emit('milestone:updated', milestone);
    res.json(milestone);
  } catch (error) {
    next(error);
  }
};

export const postUpdate = async (req, res, next) => {
  try {
    const { goalId, id } = req.params;
    const { content } = req.body;
    
    // Verify goal isolation
    const goal = await prisma.goal.findUnique({
      where: { id: goalId, workspaceId: id }
    });
    if (!goal) return sendError(res, 404, 'Goal not found in this workspace');

    const update = await prisma.goalUpdate.create({
      data: {
        goalId,
        authorId: req.user.id,
        content
      },
      include: {
        author: { select: { name: true, avatarUrl: true } }
      }
    });
    
    req.app.get('io').to(id).emit('goal:update_posted', { goalId, update });
    res.status(201).json(update);
  } catch (error) {
    next(error);
  }
};

export const getUpdates = async (req, res, next) => {
  try {
    const { goalId, id } = req.params;
    
    // Verify goal isolation
    const goal = await prisma.goal.findUnique({
      where: { id: goalId, workspaceId: id }
    });
    if (!goal) return sendError(res, 404, 'Goal not found in this workspace');

    const updates = await prisma.goalUpdate.findMany({
      where: { goalId },
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { name: true, avatarUrl: true } }
      }
    });

    res.json(updates);
  } catch (error) {
    next(error);
  }
};
