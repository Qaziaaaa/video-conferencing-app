/**
 * Admin/host control handlers: kick participant, host transfer
 */
const registerAdminHandlers = (io, socket, rooms) => {
  // kick-participant: { meetingId, targetSocketId }
  // Only the host can kick participants
  socket.on('kick-participant', ({ meetingId, targetSocketId }) => {
    if (!meetingId || !targetSocketId) return;

    const room = rooms.get(meetingId);
    if (!room) return;

    // Verify the sender is the host
    const senderMeta = room.get(socket.id);
    if (!senderMeta || !senderMeta.isHost) {
      socket.emit('error-msg', { message: 'Only the host can remove participants' });
      return;
    }

    // Cannot kick yourself
    if (targetSocketId === socket.id) {
      socket.emit('error-msg', { message: 'You cannot remove yourself' });
      return;
    }

    const targetMeta = room.get(targetSocketId);
    if (!targetMeta) {
      socket.emit('error-msg', { message: 'Participant not found' });
      return;
    }

    console.log(`[ADMIN] Host ${socket.id} kicked ${targetSocketId} from ${meetingId}`);

    // Notify the kicked participant
    io.to(targetSocketId).emit('you-were-removed', {});

    // Notify all remaining participants (room handler will clean up on disconnect,
    // but we emit user-left immediately for fast UI update)
    io.to(meetingId).emit('user-left', {
      socketId: targetSocketId,
      displayName: targetMeta.displayName,
    });

    // Remove from room state immediately
    room.delete(targetSocketId);

    // Force disconnect the kicked socket
    const kickedSocket = io.sockets.sockets.get(targetSocketId);
    if (kickedSocket) {
      kickedSocket.data.meetingId = null; // prevent double user-left on disconnect
      kickedSocket.leave(meetingId);
      kickedSocket.disconnect(true);
    }
  });
};

module.exports = registerAdminHandlers;
