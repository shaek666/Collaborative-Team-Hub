import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../lib/prisma.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

beforeAll(async () => {
  // Ensure the database is clean before starting
  await cleanup();
});

afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

export async function cleanup() {
  // Order matters due to foreign key constraints
  const deleteNotifications = prisma.notification.deleteMany();
  const deleteComments = prisma.comment.deleteMany();
  const deleteReactions = prisma.announcementReaction.deleteMany();
  const deleteAnnouncements = prisma.announcement.deleteMany();
  const deleteMilestones = prisma.milestone.deleteMany();
  const deleteGoalUpdates = prisma.goalUpdate.deleteMany();
  const deleteGoals = prisma.goal.deleteMany();
  const deleteActionItems = prisma.actionItem.deleteMany();
  const deleteMembers = prisma.workspaceMember.deleteMany();
  const deleteWorkspaces = prisma.workspace.deleteMany();
  const deleteUsers = prisma.user.deleteMany();

  await prisma.$transaction([
    deleteNotifications,
    deleteComments,
    deleteReactions,
    deleteAnnouncements,
    deleteMilestones,
    deleteGoalUpdates,
    deleteGoals,
    deleteActionItems,
    deleteMembers,
    deleteWorkspaces,
    deleteUsers,
  ]);
}
