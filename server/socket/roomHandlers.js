const Meeting = require('../models/Meeting');

const MAX_PARTICIPANTS = 8;

const registerRoomHandlers = (io, socket, rooms) => {
  // join-room: { meetingId, displayName }
  socket.on('join-room', async ({ meetingId, displayName }) => {
    try {
      if (!meetingId || !displayName) {
        socket.emit('error-msg', { message: 'meetingId and displayName are required' });
        return;
      }

      // Validate meeting exists in DB
      const meeting = await Meeting.findOne({ meetingId });
      if (!meeting) {
        socket.emit('meeting-not-found', {});
        return;
      }

      // Get or create room participant map
      if (!rooms.has(meetingId)) {
        rooms.set(meetingId, new Map());
      }
      const room = rooms.get(meetingId);

      // Enforce 8-participant limit
      if (room.size >= MAX_PARTICIPANTS) {
        socket.emit('room-full', {});
        return;
      }

      // Determine if this socket is the host
      // First joiner is host, or if meeting.hostSocketId is 'pending' (just created via REST)
      const isFirstJoiner = room.size === 0;
      const isHost = isFirstJoiner || meeting.hostSocketId === 'pending';

      // Build participant metadata
      const participantMeta = {
        socketId: socket.id,
        displayName: displayName.trim(),
        isMuted: false,
        isCameraOff: false,
        isHandRaised: false,
        isScreenSharing: false,
        isHost,
        joinedAt: Date.now(),
      };

      // Handle waiting room
      if (meeting.waitingRoomEnabled && !isHost) {
        // Find the host socket
        let hostSocketId = null;
        for (const [sid, meta] of room.entries()) {
          if (meta.isHost) {
            hostSocketId = sid;
            break;
          }
        }

        if (hostSocketId) {
          // Notify host that someone is waiting
          io.to(hostSocketId).emit('participant-waiting', {
            socketId: socket.id,
            displayName: participantMeta.displayName,
          });

          // Store in a waiting map on the socket for later admission
          socket.data.waitingFor = meetingId;
          socket.data.displayName = participantMeta.displayName;
          return; // Don't join the room yet
        }
        // If no host is present, let them in anyway
      }

      // Join the Socket.IO room
      socket.join(meetingId);
      socket.data.meetingId = meetingId;
      socket.data.displayName = participantMeta.displayName;
      socket.data.isHost = isHost;

      // Get existing participants list BEFORE adding self
      const existingParticipants = Array.from(room.values());

      // Add self to room
      room.set(socket.id, participantMeta);

      // Update DB: set hostSocketId if pending, increment participantCount
      const updateData = { participantCount: room.size };
      if (isHost && meeting.hostSocketId === 'pending') {
        updateData.hostSocketId = socket.id;
      }
      await Meeting.updateOne({ meetingId }, { $set: updateData });

      console.log(`[ROOM] ${socket.id} (${displayName}) joined ${meetingId} [${room.size}/${MAX_PARTICIPANTS}]`);

      // Send existing participants list to the new joiner
      // The new joiner will create offers to all existing participants
      socket.emit('room-joined', {
        meetingId,
        socketId: socket.id,
        isHost,
        existingParticipants,
      });

      // Notify all existing participants that a new user joined
      socket.to(meetingId).emit('user-joined', {
        socketId: socket.id,
        displayName: participantMeta.displayName,
        isHost,
      });
    } catch (err) {
      console.error('[ROOM] join-room error:', err);
      socket.emit('error-msg', { message: 'Failed to join room' });
    }
  });

  // leave-room: graceful leave
  socket.on('leave-room', ({ meetingId }) => {
    handleLeave(io, socket, rooms, meetingId);
  });

  // Handle disconnection (covers both graceful and abrupt)
  socket.on('disconnecting', () => {
    const meetingId = socket.data.meetingId;
    if (meetingId) {
      handleLeave(io, socket, rooms, meetingId);
    }
  });
};

const handleLeave = async (io, socket, rooms, meetingId) => {
  if (!meetingId || !rooms.has(meetingId)) return;

  const room = rooms.get(meetingId);
  const leavingParticipant = room.get(socket.id);

  if (!leavingParticipant) return;

  room.delete(socket.id);
  socket.leave(meetingId);
  socket.data.meetingId = null;

  console.log(`[ROOM] ${socket.id} (${leavingParticipant.displayName}) left ${meetingId} [${room.size} remaining]`);

  // Notify remaining participants
  io.to(meetingId).emit('user-left', {
    socketId: socket.id,
    displayName: leavingParticipant.displayName,
  });

  if (room.size === 0) {
    // Room is empty — mark meeting as ended
    rooms.delete(meetingId);
    try {
      await Meeting.updateOne(
        { meetingId },
        { $set: { endedAt: new Date(), participantCount: 0 } }
      );
    } catch (err) {
      console.error('[ROOM] Failed to update endedAt:', err);
    }
  } else {
    // Update participant count in DB
    try {
      await Meeting.updateOne({ meetingId }, { $set: { participantCount: room.size } });
    } catch (err) {
      console.error('[ROOM] Failed to update participantCount:', err);
    }

    // If the host left, transfer host to the next participant
    if (leavingParticipant.isHost) {
      const nextEntry = room.entries().next().value;
      if (nextEntry) {
        const [newHostSocketId, newHostMeta] = nextEntry;
        newHostMeta.isHost = true;
        room.set(newHostSocketId, newHostMeta);

        io.to(meetingId).emit('host-changed', { newHostSocketId });
        console.log(`[ROOM] Host transferred to ${newHostSocketId}`);
      }
    }
  }
};

module.exports = registerRoomHandlers;
