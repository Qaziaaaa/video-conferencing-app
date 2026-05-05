/**
 * Signaling handlers: offer, answer, ice-candidate
 * All events are TARGETED to a specific socketId (not broadcast to room).
 * This is required for mesh topology where each peer pair has its own SDP negotiation.
 */
const registerSignalingHandlers = (io, socket, rooms) => {
  // offer: { sdp, targetSocketId, meetingId }
  socket.on('offer', ({ sdp, targetSocketId, meetingId }) => {
    if (!sdp || !targetSocketId) return;
    console.log(`[SIGNAL] OFFER: ${socket.id} → ${targetSocketId}`);
    io.to(targetSocketId).emit('offer', {
      sdp,
      fromSocketId: socket.id,
    });
  });

  // answer: { sdp, targetSocketId, meetingId }
  socket.on('answer', ({ sdp, targetSocketId, meetingId }) => {
    if (!sdp || !targetSocketId) return;
    console.log(`[SIGNAL] ANSWER: ${socket.id} → ${targetSocketId}`);
    io.to(targetSocketId).emit('answer', {
      sdp,
      fromSocketId: socket.id,
    });
  });

  // ice-candidate: { candidate, targetSocketId, meetingId }
  socket.on('ice-candidate', ({ candidate, targetSocketId, meetingId }) => {
    if (!candidate || !targetSocketId) return;
    io.to(targetSocketId).emit('ice-candidate', {
      candidate,
      fromSocketId: socket.id,
    });
  });
};

module.exports = registerSignalingHandlers;
