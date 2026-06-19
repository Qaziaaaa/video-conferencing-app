const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');

jest.setTimeout(30000);

const meetingRoutes = require('../meetings');
const ChatMessage = require('../../models/ChatMessage');
const Meeting = require('../../models/Meeting');

let mongoServer;
const app = express();
app.use(express.json());
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
  await ChatMessage.deleteMany({});
  await Meeting.deleteMany({});
});

describe('GET /api/meetings/:id/chat', () => {
  it('reads chat messages belonging to the meeting', async () => {
    const meeting = await Meeting.create({
      meetingId: 'abc-defg-hij',
      hostSocketId: 'pending',
      hostUserId: new mongoose.Types.ObjectId(),
    });

    const msg = await ChatMessage.create({
      meetingId: 'abc-defg-hij',
      senderName: 'Alice',
      text: 'Hello World',
      timestamp: new Date('2023-01-01T00:00:00Z'),
    });

    const token = jwt.sign({ userId: 'some-id' }, process.env.JWT_SECRET);

    const res = await request(app)
      .get('/api/meetings/abc-defg-hij/chat')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.messages).toHaveLength(1);
    
    const fetchedMsg = res.body.messages[0];
    expect(fetchedMsg.meetingId).toBe('abc-defg-hij');
    expect(fetchedMsg.senderName).toBe('Alice');
    expect(fetchedMsg.text).toBe('Hello World');
    expect(new Date(fetchedMsg.timestamp).toISOString()).toBe(new Date('2023-01-01T00:00:00Z').toISOString());
  });
});
