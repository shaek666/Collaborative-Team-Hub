import prisma from '../lib/prisma.js';
import { sendError } from '../utils/httpResponses.js';
import { sendWorkspaceInviteEmail } from '../lib/email.js';

export const listWorkspaces = async (req, res, next) => {
  try {
    const memberships = await prisma.workspaceMember.findMany({
      where: { userId: req.user.id },
      select: {
        role: true,
        joinedAt: true,
        workspace: {
          select: {
            id: true,
            name: true,
            description: true,
            accentColour: true,
            createdAt: true
          }
        }
      }
    });
    res.json(memberships.map(m => ({ ...m.workspace, userRole: m.role, joinedAt: m.joinedAt })));
  } catch (error) {
    next(error);
  }
};

export const createWorkspace = async (req, res, next) => {
  try {
    const { name, description, accentColour } = req.body;
    // Prisma nested create handles the transaction automatically
    const workspace = await prisma.workspace.create({
      data: {
        name,
        description,
        accentColour,
        members: {
          create: {
            userId: req.user.id,
            role: 'ADMIN'
          }
        }
      }
    });
    res.status(201).json(workspace);
  } catch (error) {
    next(error);
  }
};

export const getWorkspace = async (req, res, next) => {
  try {
    const { id } = req.params;

    const workspace = await prisma.workspace.findUnique({
      where: { id },
      include: {
        members: {
          select: {
            role: true,
            joinedAt: true,
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true }
            }
          }
        }
      }
    });
    if (!workspace) return sendError(res, 404, 'Workspace not found');
    res.json(workspace);
  } catch (error) {
    next(error);
  }
};

export const updateWorkspace = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, accentColour } = req.body;
    const workspace = await prisma.workspace.update({
      where: { id },
      data: { name, description, accentColour }
    });
    res.json(workspace);
  } catch (error) {
    next(error);
  }
};

export const inviteMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { email, role } = req.body;
    
    const user = await prisma.user.findUnique({ 
      where: { email },
      select: { id: true, name: true, email: true } 
    });
    if (!user) {
      return sendError(res, 404, 'User with this email not found');
    }

    // Check if user is already a member
    const existingMember = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId: user.id, workspaceId: id } }
    });
    if (existingMember) return sendError(res, 400, 'User is already a member of this workspace');

    const workspace = await prisma.workspace.findUnique({
      where: { id },
      select: { name: true }
    });

    // Use transaction to create member and potentially a notification
    const [member] = await prisma.$transaction([
      prisma.workspaceMember.create({
        data: {
          workspaceId: id,
          userId: user.id,
          role: role || 'MEMBER'
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, avatarUrl: true }
          },
          workspace: { select: { name: true } }
        }
      }),
      prisma.notification.create({
        data: {
          userId: user.id,
          workspaceId: id,
          type: 'WORKSPACE_INVITE',
          message: `You have been invited to join ${workspace.name}.`
        }
      })
    ]);

    // Send email invitation
    try {
      await sendWorkspaceInviteEmail(user.email, workspace.name, req.user.name);
      console.log(`Invite email sent to ${user.email} for workspace ${workspace.name}`);
    } catch (emailError) {
      console.error('Failed to send invite email:', emailError);
      // Don't fail the request if email fails
    }

    // Notify the user about the new invite via Socket.io
    req.app.get('io').sockets.sockets.forEach((socket) => {
      if (socket.user?.userId === user.id) {
        socket.emit('notification:new', {
          type: 'WORKSPACE_INVITE',
          message: `You have been invited to join ${workspace.name}.`
        });
      }
    });

    res.json(member);
  } catch (error) {
    next(error);
  }
};

export const changeMemberRole = async (req, res, next) => {
  try {
    const { id, userId } = req.params;
    const { role } = req.body;
    const member = await prisma.workspaceMember.update({
      where: { userId_workspaceId: { userId, workspaceId: id } },
      data: { role },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true }
        }
      }
    });
    res.json(member);
  } catch (error) {
    next(error);
  }
};

export const removeMember = async (req, res, next) => {
  try {
    const { id, userId } = req.params;
    
    // Prevent removing the last admin
    const workspaceMembers = await prisma.workspaceMember.findMany({
      where: { workspaceId: id },
      select: { userId: true, role: true }
    });
    
    const targetMember = workspaceMembers.find(m => m.userId === userId);
    if (!targetMember) return sendError(res, 404, 'Member not found');
    
    if (targetMember.role === 'ADMIN') {
      const adminCount = workspaceMembers.filter(m => m.role === 'ADMIN').length;
      if (adminCount <= 1) {
        return sendError(res, 400, 'Cannot remove the last admin');
      }
    }

    await prisma.workspaceMember.delete({
      where: { userId_workspaceId: { userId, workspaceId: id } }
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
