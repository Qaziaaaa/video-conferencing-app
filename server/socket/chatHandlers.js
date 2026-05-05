const ChatMessage = require('../models/ChatMessage');

/**
 * Chat handlers: real-time message relay + MongoDB persistence
 */
const registerChatHandlers = (io, socket, rooms) => {
  // chat-message: { meetingId, senderName, text, timestamp }
  socket.on('chat-message', async ({ meetingId, senderName, text, timestamp }) => {
    if (!meetingId || !senderName || !text) return;

    // Validate message length
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
      const saved = await ChatMessage.create({
        meetingId,
        senderName: senderName.trim(),
        text: text.trim(),
        timestamp: timestamp ? new Date(timestamp) : new Date(),
      });

      const messagePayload = {
        _id: saved._id,
        meetingId: saved.meetingId,
        senderName: saved.senderName,
        text: saved.text,
        timestamp: saved.timestamp,
      };

      // Relay to ALL participants in the room (including sender for confirmation)
      io.to(meetingId).emit('chat-message', messagePayload);

      console.log(`[CHAT] Message in ${meetingId} from ${senderName}: ${text.slice(0, 50)}`);
    } catch (err) {
      console.error('[CHAT] Failed to save message:', err);
      socket.emit('error-msg', { message: 'Failed to send message' });
    }
  });
};

module.exports = registerChatHandlers;
