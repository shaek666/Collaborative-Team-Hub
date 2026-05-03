import request from 'supertest';
import app from '../app.js';
import { cleanup } from './setup.js';

describe('Workspace Endpoints', () => {
  let cookie;
  const testUser = {
    name: 'Workspace User',
    email: 'ws@example.com',
    password: 'Password123!',
  };

  beforeEach(async () => {
    await cleanup();
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);
    cookie = res.headers['set-cookie'];
  });

  describe('POST /api/workspaces', () => {
    it('should create a new workspace when authenticated', async () => {
      const res = await request(app)
        .post('/api/workspaces')
        .set('Cookie', cookie)
        .send({
          name: 'Test Workspace',
          accentColour: '#ff0000',
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.name).toEqual('Test Workspace');
    });

    it('should return 401 when unauthenticated', async () => {
      const res = await request(app)
        .post('/api/workspaces')
        .send({ name: 'Fail' });

      expect(res.statusCode).toEqual(401);
    });
  });

  describe('GET /api/workspaces', () => {
    it('should list workspaces for authenticated user', async () => {
      // Create one
      await request(app)
        .post('/api/workspaces')
        .set('Cookie', cookie)
        .send({ name: 'WS 1' });

      const res = await request(app)
        .get('/api/workspaces')
        .set('Cookie', cookie);

      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].name).toEqual('WS 1');
    });
  });
});
