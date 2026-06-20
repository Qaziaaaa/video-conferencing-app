const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const registerRoomHandlers = require('./roomHandlers');
const registerSignalingHandlers = require('./signalingHandlers');
const registerMediaHandlers = require('./mediaHandlers');
const registerChatHandlers = require('./chatHandlers');
const registerHandHandlers = require('./handHandlers');
const registerAdminHandlers = require('./adminHandlers');
const registerWaitingRoomHandlers = require('./waitingRoomHandlers');

// In-memory room state: roomId -> Map<socketId, participantMeta>
// Shared across all handler modules
const rooms = new Map();

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Optional JWT auth middleware on socket handshake
  // If token is present and valid, attach user info to socket.data
  // If token is missing or invalid, still allow connection (guest mode)
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.data.user = decoded;
      } catch {
        // Invalid token — proceed as guest
        socket.data.user = null;
      }
    } else {
      socket.data.user = null;
    }
    next();
  });

  io.on('connection', (socket) => {
    console.log(`[SOCKET] Connected: ${socket.id}`);

    // Register all event handlers, passing shared state
    registerRoomHandlers(io, socket, rooms);
    registerSignalingHandlers(io, socket, rooms);
    registerMediaHandlers(io, socket, rooms);
    registerChatHandlers(io, socket, rooms);
    registerHandHandlers(io, socket, rooms);
    registerAdminHandlers(io, socket, rooms);
    registerWaitingRoomHandlers(io, socket, rooms);

    socket.on('disconnect', () => {
      console.log(`[SOCKET] Disconnected: ${socket.id}`);
    });
  });

  return io;
};

module.exports = { initSocket };
