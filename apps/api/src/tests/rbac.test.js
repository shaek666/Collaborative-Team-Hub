import request from 'supertest';
import app from '../app.js';
import { cleanup } from './setup.js';
import prisma from '../lib/prisma.js';
import bcrypt from 'bcryptjs';

describe('RBAC Permissions', () => {
  let adminCookie, memberCookie, workspaceId, goalId;

  beforeEach(async () => {
    await cleanup();

    // 1. Create Admin
    const admin = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@example.com',
        passwordHash: await bcrypt.hash('Password123!', 12),
      }
    });

    // 2. Create Member
    const member = await prisma.user.create({
      data: {
        name: 'Member User',
        email: 'member@example.com',
        passwordHash: await bcrypt.hash('Password123!', 12),
      }
    });

    // 3. Create Workspace with Admin
    const workspace = await prisma.workspace.create({
      data: {
        name: 'RBAC Workspace',
        members: {
          create: { userId: admin.id, role: 'ADMIN' }
        }
      }
    });
    workspaceId = workspace.id;

    // 4. Add Member to Workspace
    await prisma.workspaceMember.create({
      data: { userId: member.id, workspaceId: workspace.id, role: 'MEMBER' }
    });

    // 5. Create a Goal
    const goal = await prisma.goal.create({
      data: {
        title: 'Delete Me',
        workspaceId: workspace.id,
        ownerId: admin.id
      }
    });
    goalId = goal.id;

    // 6. Get Cookies
    const adminLogin = await request(app).post('/api/auth/login').send({ email: 'admin@example.com', password: 'Password123!' });
    adminCookie = adminLogin.headers['set-cookie'];

    const memberLogin = await request(app).post('/api/auth/login').send({ email: 'member@example.com', password: 'Password123!' });
    memberCookie = memberLogin.headers['set-cookie'];
  });

  describe('Announcements Creation', () => {
    it('should allow Admin to create announcement', async () => {
      const res = await request(app)
        .post(`/api/workspaces/${workspaceId}/announcements`)
        .set('Cookie', adminCookie)
        .send({ title: 'Admin News', content: 'Hello' });

      expect(res.statusCode).toEqual(201);
    });

    it('should deny Member from creating announcement', async () => {
      const res = await request(app)
        .post(`/api/workspaces/${workspaceId}/announcements`)
        .set('Cookie', memberCookie)
        .send({ title: 'Member News', content: 'Fail' });

      expect(res.statusCode).toEqual(403);
    });
  });

  describe('Goal Deletion', () => {
    it('should allow Admin to delete goal', async () => {
      const res = await request(app)
        .delete(`/api/workspaces/${workspaceId}/goals/${goalId}`)
        .set('Cookie', adminCookie);

      expect(res.statusCode).toEqual(200);
    });

    it('should deny Member from deleting goal', async () => {
      const res = await request(app)
        .delete(`/api/workspaces/${workspaceId}/goals/${goalId}`)
        .set('Cookie', memberCookie);

      expect(res.statusCode).toEqual(403);
    });
  });
});
