import request from 'supertest';
import app from '../app.js';
import { cleanup } from './setup.js';

describe('Auth Endpoints', () => {
  const testUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'Password123!',
  };

  beforeEach(async () => {
    await cleanup();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user and set a cookie', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.email).toEqual(testUser.email);
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should return 400 for duplicate email', async () => {
      // First registration
      await request(app).post('/api/auth/register').send(testUser);
      
      // Duplicate registration
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toMatch(/already exists/i);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(testUser);
    });

    it('should login with correct credentials and set a cookie', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      expect(res.statusCode).toEqual(200);
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should return 401 for wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword',
        });

      expect(res.statusCode).toEqual(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should clear the cookie', async () => {
      const res = await request(app).post('/api/auth/logout');
      expect(res.statusCode).toEqual(200);
      expect(res.headers['set-cookie'][0]).toMatch(/accessToken=;/);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return 401 when not authenticated', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.statusCode).toEqual(401);
    });

    it('should return user profile when authenticated', async () => {
      const loginRes = await request(app)
        .post('/api/auth/register')
        .send(testUser);
      
      const cookie = loginRes.headers['set-cookie'];

      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', cookie);

      expect(res.statusCode).toEqual(200);
      expect(res.body.email).toEqual(testUser.email);
    });
  });
});
