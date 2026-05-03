import prisma from '../lib/prisma.js';

export const getWorkspaceId = (req) => {
  return req.params.workspaceId || req.params.id || req.body.workspaceId;
};

export const checkWorkspaceMember = async (userId, workspaceId) => {
  try {
    if (!userId || !workspaceId) return null;

    return prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId,
        },
      },
    });
  } catch (error) {
    throw error;
  }
};
