const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

jest.setTimeout(30000);

const authRoutes = require('../auth');
const meetingRoutes = require('../meetings');
const User = require('../../models/User');

let mongoServer;
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/meetings', meetingRoutes);

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  process.env.JWT_SECRET = 'test-secret';
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await User.deleteMany({});
});

describe('Auth Integration Flow', () => {
  it('registers, logs in, accesses protected route, and blocks unauthorized access', async () => {
    // 1. Register
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'password123', displayName: 'Test User' });
    expect(registerRes.status).toBe(201);
    
    // 2. Login
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });
    expect(loginRes.status).toBe(200);
    
    const token = loginRes.body.token;
    expect(token).toBeDefined();

    // 3. Call protected endpoint with JWT
    const protectedRes = await request(app)
      .post('/api/meetings')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(protectedRes.status).toBe(201);

    // 4. Call without JWT
    const unauthorizedRes = await request(app)
      .post('/api/meetings')
      .send({});
    expect(unauthorizedRes.status).toBe(401);
  });
});
