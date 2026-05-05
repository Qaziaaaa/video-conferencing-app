/**
 * Waiting room handlers: admit/deny participants
 */
const registerWaitingRoomHandlers = (io, socket, rooms) => {
  // admit-participant: { meetingId, targetSocketId }
  // Host admits a waiting participant into the room
  socket.on('admit-participant', async ({ meetingId, targetSocketId }) => {
    if (!meetingId || !targetSocketId) return;

    const room = rooms.get(meetingId);
    if (!room) return;

    // Verify sender is host
    const senderMeta = room.get(socket.id);
    if (!senderMeta || !senderMeta.isHost) {
      socket.emit('error-msg', { message: 'Only the host can admit participants' });
      return;
    }

    // Check room capacity
    if (room.size >= 8) {
      socket.emit('error-msg', { message: 'Room is full' });
      io.to(targetSocketId).emit('room-full', {});
      return;
    }

    const targetSocket = io.sockets.sockets.get(targetSocketId);
    if (!targetSocket) {
      socket.emit('error-msg', { message: 'Participant is no longer waiting' });
      return;
    }

    const displayName = targetSocket.data.displayName || 'Guest';

    // Add to room
    const participantMeta = {
      socketId: targetSocketId,
      displayName,
      isMuted: false,
      isCameraOff: false,
      isHandRaised: false,
      isScreenSharing: false,
      isHost: false,
      joinedAt: Date.now(),
    };

    const existingParticipants = Array.from(room.values());
    room.set(targetSocketId, participantMeta);

    targetSocket.join(meetingId);
    targetSocket.data.meetingId = meetingId;
    targetSocket.data.waitingFor = null;

    // Tell the admitted participant they're in
    io.to(targetSocketId).emit('admitted', {});
    io.to(targetSocketId).emit('room-joined', {
      meetingId,
      socketId: targetSocketId,
      isHost: false,
      existingParticipants,
    });

    // Notify existing participants
    socket.to(meetingId).emit('user-joined', {
      socketId: targetSocketId,
      displayName,
      isHost: false,
    });

    console.log(`[WAITING] ${targetSocketId} (${displayName}) admitted to ${meetingId}`);
  });

  // deny-participant: { meetingId, targetSocketId }
  socket.on('deny-participant', ({ meetingId, targetSocketId }) => {
    if (!meetingId || !targetSocketId) return;

    const room = rooms.get(meetingId);
    if (!room) return;

    // Verify sender is host
    const senderMeta = room.get(socket.id);
    if (!senderMeta || !senderMeta.isHost) {
      socket.emit('error-msg', { message: 'Only the host can deny participants' });
      return;
    }

    io.to(targetSocketId).emit('denied', {});
    console.log(`[WAITING] ${targetSocketId} denied entry to ${meetingId}`);
  });
};

module.exports = registerWaitingRoomHandlers;
