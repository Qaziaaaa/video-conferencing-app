/**
 * Media state handlers: mute/camera state sync, screen sharing
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
  // Enforce one-at-a-time: check if anyone else is already sharing
  socket.on('screen-share-started', ({ meetingId }) => {
    if (!meetingId) return;

    const room = rooms.get(meetingId);
    if (room) {
      // Check if another participant is already sharing
      for (const [sid, meta] of room.entries()) {
        if (sid !== socket.id && meta.isScreenSharing) {
          socket.emit('error-msg', { message: 'Screen sharing is already active' });
          return;
        }
      }

      // Mark this participant as screen sharing
      if (room.has(socket.id)) {
        const meta = room.get(socket.id);
        meta.isScreenSharing = true;
        room.set(socket.id, meta);
      }
    }

    socket.to(meetingId).emit('screen-share-started', { socketId: socket.id });
    console.log(`[MEDIA] Screen share started by ${socket.id} in ${meetingId}`);
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
    console.log(`[MEDIA] Screen share stopped by ${socket.id} in ${meetingId}`);
  });
};

module.exports = registerMediaHandlers;
