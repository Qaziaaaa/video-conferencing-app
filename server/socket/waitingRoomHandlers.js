/**
 * Waiting room handlers: admit-participant, deny-participant
 */
const registerWaitingRoomHandlers = (io, socket, rooms) => {
  // admit-participant: { meetingId, targetSocketId } — host admits a waiting participant
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

    // Notify the waiting participant they've been admitted
    io.to(targetSocketId).emit('admitted', { meetingId });

    console.log(`[WAITING] ${socket.id} admitted ${targetSocketId} to ${meetingId}`);
  });

  // deny-participant: { meetingId, targetSocketId } — host denies a waiting participant
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

    // Notify the waiting participant they've been denied
    io.to(targetSocketId).emit('denied', {});

    console.log(`[WAITING] ${socket.id} denied ${targetSocketId} from ${meetingId}`);
  });
};

module.exports = registerWaitingRoomHandlers;
