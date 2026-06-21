const express = require('express');
const authMiddleware = require('../middleware/auth');
const Meeting = require('../models/Meeting');
const ChatMessage = require('../models/ChatMessage');
const { generateMeetingId } = require('../utils/meetingId');

const router = express.Router();

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// POST /api/meetings — create a new meeting (JWT required)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { waitingRoomEnabled = false, password = null } = req.body;
    const meetingId = generateMeetingId();

    // hostSocketId is not known at creation time (socket connects later)
    // Use a placeholder; it will be updated when the host joins via socket
    const meeting = await Meeting.create({
      meetingId,
      hostSocketId: 'pending',
      hostUserId: req.user.userId,
      waitingRoomEnabled: Boolean(waitingRoomEnabled),
      password: password ? String(password) : null,
    });

    const shareUrl = `${CLIENT_ORIGIN}/meeting/${meetingId}`;

    return res.status(201).json({
      meetingId: meeting.meetingId,
      shareUrl,
      createdAt: meeting.createdAt,
    });
  } catch (err) {
    console.error('[MEETINGS] Create error:', err);
    return res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
});

// GET /api/meetings/:meetingId — public metadata
router.get('/:meetingId', async (req, res) => {
  try {
    const meeting = await Meeting.findOne({ meetingId: req.params.meetingId });
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found', code: 'MEETING_NOT_FOUND' });
    }

    return res.status(200).json({
      meetingId: meeting.meetingId,
      participantCount: meeting.participantCount,
      status: meeting.endedAt ? 'ended' : 'active',
      waitingRoomEnabled: meeting.waitingRoomEnabled,
      hasPassword: !!meeting.password,
      createdAt: meeting.createdAt,
    });
  } catch (err) {
    console.error('[MEETINGS] Get error:', err);
    return res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
});

// GET /api/meetings/:meetingId/chat — chat history (JWT required)
router.get('/:meetingId/chat', authMiddleware, async (req, res) => {
  try {
    const meeting = await Meeting.findOne({ meetingId: req.params.meetingId });
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found', code: 'MEETING_NOT_FOUND' });
    }

    const messages = await ChatMessage.find({ meetingId: req.params.meetingId })
      .sort({ timestamp: 1 })
      .lean();

    return res.status(200).json({ messages });
  } catch (err) {
    console.error('[MEETINGS] Chat history error:', err);
    return res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
});

module.exports = router;
