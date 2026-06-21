const registerEmojiHandlers = (io, socket, rooms) => {
  socket.on('emoji-reaction', ({ meetingId, emoji, displayName }) => {
    if (!meetingId || !emoji) return;

    const room = rooms.get(meetingId);
    if (!room || !room.has(socket.id)) return;

    const sender = room.get(socket.id);

    io.to(meetingId).emit('emoji-reaction', {
      socketId: socket.id,
      emoji,
      displayName: displayName || sender?.displayName || 'Someone',
    });
  });
};

module.exports = registerEmojiHandlers;
