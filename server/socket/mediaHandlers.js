/**
 * Media state handlers: participant-media-state, screen-share-started, screen-share-stopped
 */
const registerMediaHandlers = (io, socket, rooms) => {
  // participant-media-state: { meetingId, isMuted, isCameraOff }
  socket.on('participant-media-state', ({ meetingId, isMuted, isCameraOff }) => {
    if (!meetingId) return;

    // Update in-memory participant metadata
    const room = rooms.get(meetingId);
    if (room && room.has(socket.id)) {
      const meta = room.get(socket.id);
      meta.isMuted = Boolean(isMuted);
      meta.isCameraOff = Boolean(isCameraOff);
      room.set(socket.id, meta);
    }

    // Relay to all other participants in the room
    socket.to(meetingId).emit('participant-media-state', {
      socketId: socket.id,
      isMuted: Boolean(isMuted),
      isCameraOff: Boolean(isCameraOff),
    });
  });

  // screen-share-started: { meetingId }
  socket.on('screen-share-started', ({ meetingId }) => {
    if (!meetingId) return;

    // Check if someone is already sharing — enforce one-at-a-time
    const room = rooms.get(meetingId);
    if (room) {
      for (const [sid, meta] of room.entries()) {
        if (meta.isScreenSharing && sid !== socket.id) {
          socket.emit('error-msg', { message: 'Screen sharing is already active in this meeting' });
          return;
        }
      }

      // Mark this participant as screen sharing
      const meta = room.get(socket.id);
      if (meta) {
        meta.isScreenSharing = true;
        room.set(socket.id, meta);
      }
    }

    socket.to(meetingId).emit('screen-share-started', { socketId: socket.id });
  });

  // screen-share-stopped: { meetingId }
  socket.on('screen-share-stopped', ({ meetingId }) => {
    if (!meetingId) return;

    const room = rooms.get(meetingId);
    if (room && room.has(socket.id)) {
      const meta = room.get(socket.id);
      meta.isScreenSharing = false;
      room.set(socket.id, meta);
    }

    socket.to(meetingId).emit('screen-share-stopped', { socketId: socket.id });
  });
};

module.exports = registerMediaHandlers;
