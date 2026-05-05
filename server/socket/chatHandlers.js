const ChatMessage = require('../models/ChatMessage');

/**
 * Chat handlers: chat-message
 */
const registerChatHandlers = (io, socket, rooms) => {
  // chat-message: { meetingId, senderName, text, timestamp }
  socket.on('chat-message', async ({ meetingId, senderName, text, timestamp }) => {
    if (!meetingId || !senderName || !text) return;

    // Validate text length
    if (typeof text !== 'string' || text.trim().length === 0) {
      socket.emit('error-msg', { message: 'Message cannot be empty' });
      return;
    }

    if (text.length > 1000) {
      socket.emit('error-msg', { message: 'Message exceeds 1000 character limit' });
      return;
    }

    try {
      // Persist to MongoDB
      const msg = await ChatMessage.create({
        meetingId,
        senderName: senderName.trim(),
        text: text.trim(),
        timestamp: timestamp ? new Date(timestamp) : new Date(),
      });

      const payload = {
        _id: msg._id,
        meetingId: msg.meetingId,
        senderName: msg.senderName,
        text: msg.text,
        timestamp: msg.timestamp.toISOString(),
      };

      // Relay to ALL participants in the room (including sender)
      io.to(meetingId).emit('chat-message', payload);
    } catch (err) {
      console.error('[CHAT] Failed to save message:', err);
      socket.emit('error-msg', { message: 'Failed to send message' });
    }
  });
};

module.exports = registerChatHandlers;
