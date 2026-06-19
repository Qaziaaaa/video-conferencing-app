const ChatMessage = require('../models/ChatMessage');
const { validateChatMessage } = require('../utils/chatValidation');

/**
 * Chat handlers: chat-message
 */
const registerChatHandlers = (io, socket, rooms) => {
  // chat-message: { meetingId, senderName, text, timestamp }
  socket.on('chat-message', async ({ meetingId, senderName, text, timestamp }) => {
    if (!meetingId || !senderName || !text) return;

    // Validate text length
    const errorMsg = validateChatMessage(text);
    if (errorMsg) {
      socket.emit('error-msg', { message: errorMsg });
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
