import prisma from '../lib/prisma.js';
import { sendError } from '../utils/httpResponses.js';

export const listAnnouncements = async (req, res, next) => {
  try {
    const { id } = req.params; // workspaceId
    const { cursor, limit = 10 } = req.query;

    const announcements = await prisma.announcement.findMany({
      where: { workspaceId: id },
      take: Number(limit),
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' }
      ],
      select: {
        id: true,
        content: true,
        isPinned: true,
        createdAt: true,
        author: {
          select: { name: true, avatarUrl: true }
        },
        reactions: {
          select: { id: true, emoji: true, userId: true }
        },
        _count: {
          select: { comments: true }
        }
      }
    });

    const nextCursor = announcements.length === Number(limit) ? announcements[announcements.length - 1].id : null;

    res.json({ data: announcements, nextCursor });
  } catch (error) {
    next(error);
  }
};

export const createAnnouncement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content, isPinned } = req.body;
    const announcement = await prisma.announcement.create({
      data: {
        workspaceId: id,
        authorId: req.user.id,
        content,
        isPinned: isPinned || false
      },
      include: {
        author: { select: { name: true, avatarUrl: true } }
      }
    });
    
    req.app.get('io').to(id).emit('announcement:created', announcement);
    res.status(201).json(announcement);
  } catch (error) {
    next(error);
  }
};

export const togglePin = async (req, res, next) => {
  try {
    const { id, announcementId } = req.params; // id is workspaceId
    const announcement = await prisma.announcement.findUnique({ 
      where: { id: announcementId, workspaceId: id }, // Hardened isolation
      select: { isPinned: true }
    });
    if (!announcement) return sendError(res, 404, 'Announcement not found in this workspace');

    const updated = await prisma.announcement.update({
      where: { id: announcementId },
      data: { isPinned: !announcement.isPinned }
    });
    
    req.app.get('io').to(id).emit('announcement:pinToggled', { announcementId, isPinned: updated.isPinned });
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const deleteAnnouncement = async (req, res, next) => {
  try {
    const { id, announcementId } = req.params;
    await prisma.announcement.delete({ 
      where: { 
        id: announcementId,
        workspaceId: id // Hardened isolation
      } 
    });
    
    req.app.get('io').to(id).emit('announcement:deleted', announcementId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const addReaction = async (req, res, next) => {
  try {
    const { id, announcementId } = req.params;
    const { emoji } = req.body;
    
    // Verify isolation
    const announcement = await prisma.announcement.findUnique({
      where: { id: announcementId, workspaceId: id }
    });
    if (!announcement) return sendError(res, 404, 'Announcement not found');

    const reaction = await prisma.announcementReaction.create({
      data: { announcementId, userId: req.user.id, emoji }
    });

    const allReactions = await prisma.announcementReaction.findMany({
      where: { announcementId }
    });
    
    req.app.get('io').to(id).emit('announcement:reacted', { announcementId, reactions: allReactions });
    res.status(201).json(reaction);
  } catch (error) {
    next(error);
  }
};

export const addComment = async (req, res, next) => {
  try {
    const { id, announcementId } = req.params;
    const { content } = req.body;
    
    // Verify isolation
    const announcement = await prisma.announcement.findUnique({
      where: { id: announcementId, workspaceId: id },
      select: { authorId: true }
    });
    if (!announcement) return sendError(res, 404, 'Announcement not found');

    // Atomic transaction for comment + notification
    const [comment] = await prisma.$transaction([
      prisma.comment.create({
        data: { announcementId, authorId: req.user.id, content },
        include: {
          author: { select: { name: true, avatarUrl: true } }
        }
      }),
      // Notify the announcement author if it's not the same person
      ...(announcement.authorId !== req.user.id ? [
        prisma.notification.create({
          data: {
            userId: announcement.authorId,
            workspaceId: id,
            type: 'ANNOUNCEMENT_COMMENT',
            message: `${req.user.name} commented on your announcement.`
          }
        })
      ] : [])
    ]);
    
    req.app.get('io').to(id).emit('announcement:commented', { announcementId, comment });
    res.status(201).json(comment);
  } catch (error) {
    next(error);
  }
};
