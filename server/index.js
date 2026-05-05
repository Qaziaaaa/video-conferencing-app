require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();
const server = http.createServer(app);

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] }));
app.use(express.json());

// REST Routes (mounted after socket setup below)
const authRoutes = require('./routes/auth');
const meetingRoutes = require('./routes/meetings');
app.use('/api/auth', authRoutes);
app.use('/api/meetings', meetingRoutes);

// Socket.IO
const { initSocket } = require('./socket');
initSocket(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
});
