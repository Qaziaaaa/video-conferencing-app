const mongoose = require('mongoose');

const MeetingSchema = new mongoose.Schema({
  meetingId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  hostSocketId: {
    type: String,
    required: true,
  },
  hostUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  endedAt: {
    type: Date,
    default: null,
  },
  participantCount: {
    type: Number,
    default: 0,
  },
  waitingRoomEnabled: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model('Meeting', MeetingSchema);
