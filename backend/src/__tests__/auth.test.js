const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');

describe('Auth API Integration Tests', () => {
  const testUser = {
    fullName: 'Test Doctor',
    email: 'testdoctor@hospital.com',
    password: 'TestPass123!',
    role: 'doctor',
    mobileNumber: '+911234567890',
  };

  let authToken;
  let userId;

  beforeAll(async () => {
    // Connect to test database
    const testUri = process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/hospital_test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(testUri);
    }
    // Clean up test user
    await User.deleteOne({ email: testUser.email });
  });

  afterAll(async () => {
    await User.deleteOne({ email: testUser.email });
    await mongoose.disconnect();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user.email).toBe(testUser.email);
      authToken = res.body.data.token;
      userId = res.body.data.user._id;
    });

    it('should reject duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(409);

      expect(res.body.success).toBe(false);
    });

    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({})
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      authToken = res.body.data.token;
    });

    it('should reject invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'wrongpassword' })
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should reject non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@test.com', password: 'test123' })
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user profile', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testUser.email);
    });

    it('should reject without token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .expect(401);
    });
  });
});