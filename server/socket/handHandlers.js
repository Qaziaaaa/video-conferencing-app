/**
 * Raise/lower hand handlers
 */
const registerHandHandlers = (io, socket, rooms) => {
  // raise-hand: { meetingId, displayName }
  socket.on('raise-hand', ({ meetingId, displayName }) => {
    if (!meetingId) return;

    const room = rooms.get(meetingId);
    if (room && room.has(socket.id)) {
      const meta = room.get(socket.id);
      meta.isHandRaised = true;
      room.set(socket.id, meta);
    }

    // Relay to all other participants
    socket.to(meetingId).emit('raise-hand', {
      socketId: socket.id,
      displayName: displayName || socket.data.displayName,
    });

    console.log(`[HAND] ${socket.id} raised hand in ${meetingId}`);
  });

  // lower-hand: { meetingId }
  socket.on('lower-hand', ({ meetingId }) => {
    if (!meetingId) return;

    const room = rooms.get(meetingId);
    if (room && room.has(socket.id)) {
      const meta = room.get(socket.id);
      meta.isHandRaised = false;
      room.set(socket.id, meta);
    }

    socket.to(meetingId).emit('lower-hand', { socketId: socket.id });

    console.log(`[HAND] ${socket.id} lowered hand in ${meetingId}`);
  });
};

module.exports = registerHandHandlers;
