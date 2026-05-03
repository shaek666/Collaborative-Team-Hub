import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  try {
  // 1. Create Demo User
  const passwordHash = await bcrypt.hash('Demo1234!', 10);
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@teamhub.dev' },
    update: {},
    create: {
      email: 'demo@teamhub.dev',
      name: 'Demo User',
      passwordHash: passwordHash,
      avatarUrl: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
    },
  });

  // 2. Create Workspace
  const workspace = await prisma.workspace.create({
    data: {
      name: 'FredoCloud HQ',
      description: 'Central hub for FredoCloud team collaboration',
      accentColour: '#3b82f6',
      members: {
        create: {
          userId: demoUser.id,
          role: 'ADMIN',
        },
      },
    },
  });

  // 3. Create Goals & Milestones
  await prisma.goal.create({
    data: {
      title: 'Launch Q3 Marketing Campaign',
      ownerId: demoUser.id,
      workspaceId: workspace.id,
      status: 'IN_PROGRESS',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      milestones: {
        create: [
          { title: 'Finalize brand assets', progressPercent: 100, completed: true },
          { title: 'Social media rollout', progressPercent: 40, completed: false },
        ],
      },
    },
  });

  await prisma.goal.create({
    data: {
      title: 'Infrastructure Migration to Railway',
      ownerId: demoUser.id,
      workspaceId: workspace.id,
      status: 'NOT_STARTED',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      milestones: {
        create: [
          { title: 'Configure environment variables', progressPercent: 0, completed: false },
        ],
      },
    },
  });

  const goal3 = await prisma.goal.create({
    data: {
      title: 'Complete FredoCloud Assessment',
      ownerId: demoUser.id,
      workspaceId: workspace.id,
      status: 'COMPLETED',
      dueDate: new Date(),
      milestones: {
        create: [
          { title: 'Scaffold monorepo', progressPercent: 100, completed: true },
          { title: 'Implement RBAC', progressPercent: 100, completed: true },
        ],
      },
    },
  });

  // 4. Create Announcements
  await prisma.announcement.create({
    data: {
      workspaceId: workspace.id,
      authorId: demoUser.id,
      content: 'Welcome to the new FredoCloud HQ Workspace! 🚀',
      isPinned: true,
    },
  });

  await prisma.announcement.create({
    data: {
      workspaceId: workspace.id,
      authorId: demoUser.id,
      content: 'Reminder: All-hands meeting this Friday at 10 AM.',
      isPinned: false,
    },
  });

  // 5. Create Action Items
  await prisma.actionItem.createMany({
    data: [
      {
        title: 'Review PR for Auth middleware',
        workspaceId: workspace.id,
        assigneeId: demoUser.id,
        priority: 'HIGH',
        status: 'TODO',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      },
      {
        title: 'Update documentation for API endpoints',
        workspaceId: workspace.id,
        assigneeId: demoUser.id,
        priority: 'MEDIUM',
        status: 'IN_PROGRESS',
        goalId: goal3.id,
      },
      {
        title: 'Setup Cloudinary signed uploads',
        workspaceId: workspace.id,
        assigneeId: demoUser.id,
        priority: 'URGENT',
        status: 'TODO',
      },
      {
        title: 'Fix responsive layout in sidebar',
        workspaceId: workspace.id,
        assigneeId: demoUser.id,
        priority: 'LOW',
        status: 'DONE',
      },
      {
        title: 'Test optimistic UI rollbacks',
        workspaceId: workspace.id,
        assigneeId: demoUser.id,
        priority: 'HIGH',
        status: 'IN_REVIEW',
      },
    ],
  });
  } catch (error) {
    throw error;
  }
}

main()
  .catch((e) => {
    process.stderr.write(`${e.stack || e.message || e}\n`);
    process.exit(1);
  })
  .finally(async () => {
    try {
      await prisma.$disconnect();
    } catch (e) {
      process.stderr.write(`${e.stack || e.message || e}\n`);
      process.exit(1);
    }
  });
