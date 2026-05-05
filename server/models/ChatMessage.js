const mongoose = require('mongoose');

const ChatMessageSchema = new mongoose.Schema({
  meetingId: {
    type: String,
    required: true,
    index: true,
  },
  senderName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
  },
  text: {
    type: String,
    required: true,
    maxlength: 1000,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// Compound index for efficient history queries ordered by time
ChatMessageSchema.index({ meetingId: 1, timestamp: 1 });

module.exports = mongoose.model('ChatMessage', ChatMessageSchema);
