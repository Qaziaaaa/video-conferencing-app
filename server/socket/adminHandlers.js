/**
 * Admin handlers: kick-participant
 */
const registerAdminHandlers = (io, socket, rooms) => {
  // kick-participant: { meetingId, targetSocketId }
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
    if (targetSocketId === socket.id) return;

    const targetMeta = room.get(targetSocketId);
    if (!targetMeta) return;

    // Notify the kicked participant
    io.to(targetSocketId).emit('you-were-removed', {});

    // Notify remaining participants (the kicked user's disconnect will trigger user-left,
    // but we also emit it proactively so the UI updates immediately)
    socket.to(meetingId).emit('user-left', {
      socketId: targetSocketId,
      displayName: targetMeta.displayName,
    });

    // Remove from room state
    room.delete(targetSocketId);

    console.log(`[ADMIN] ${socket.id} kicked ${targetSocketId} from ${meetingId}`);
  });
};

module.exports = registerAdminHandlers;
