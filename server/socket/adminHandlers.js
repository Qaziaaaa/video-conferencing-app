/**
 * Admin handlers: kick-participant, mute-all, lock-room
 */
const lockedRooms = new Set();

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

    // Notify ALL remaining participants INCLUDING the host
    // io.to() includes everyone in the room, unlike socket.to() which excludes sender
    io.to(meetingId).emit('user-left', {
      socketId: targetSocketId,
      displayName: targetMeta.displayName,
    });

    // Remove from room state
    room.delete(targetSocketId);

    console.log(`[ADMIN] ${socket.id} kicked ${targetSocketId} from ${meetingId}`);
  });

  // mute-all: host mutes all participants
  socket.on('mute-all', ({ meetingId }) => {
    if (!meetingId) return;
    const room = rooms.get(meetingId);
    if (!room) return;

    const senderMeta = room.get(socket.id);
    if (!senderMeta || !senderMeta.isHost) {
      socket.emit('error-msg', { message: 'Only the host can mute all' });
      return;
    }

    socket.to(meetingId).emit('mute-participant', {});
  });

  // lock-room: host locks the room (no new joiners)
  socket.on('lock-room', ({ meetingId }) => {
    if (!meetingId) return;
    const room = rooms.get(meetingId);
    if (!room) return;
    const senderMeta = room.get(socket.id);
    if (!senderMeta || !senderMeta.isHost) {
      socket.emit('error-msg', { message: 'Only the host can lock the meeting' });
      return;
    }
    lockedRooms.add(meetingId);
    io.to(meetingId).emit('room-locked', {});
  });

  socket.on('unlock-room', ({ meetingId }) => {
    lockedRooms.delete(meetingId);
    io.to(meetingId).emit('room-unlocked', {});
  });

  // Check lock status
  socket.on('is-room-locked', ({ meetingId }, callback) => {
    callback(lockedRooms.has(meetingId));
  });
};

module.exports = registerAdminHandlers;
module.exports.lockedRooms = lockedRooms;

module.exports = registerAdminHandlers;
