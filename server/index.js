require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

// Manual NoSQL injection sanitizer (replaces express-mongo-sanitize which conflicts with Express getter-only req.query)
const sanitizeValue = (val) => {
  if (typeof val === 'string') return val.replace(/\$/g, '').replace(/\./g, '');
  if (Array.isArray(val)) return val.map(sanitizeValue);
  if (val && typeof val === 'object') {
    const clean = {};
    for (const [k, v] of Object.entries(val)) {
      clean[k.replace(/\$/g, '').replace(/\./g, '')] = sanitizeValue(v);
    }
    return clean;
  }
  return val;
};
const noSqlSanitizer = (req, res, next) => {
  if (req.body) req.body = sanitizeValue(req.body);
  next();
};
const connectDB = require('./config/db');
const { errorHandler, gracefulShutdown } = require('./middleware/errorHandler');

// Validate required env vars
if (!process.env.JWT_SECRET) {
  console.error('[FATAL] JWT_SECRET is not set in environment');
  process.exit(1);
}
if (!process.env.MONGODB_URI) {
  console.error('[FATAL] MONGODB_URI is not set in environment');
  process.exit(1);
}

const app = express();
const server = http.createServer(app);

// Connect to MongoDB
connectDB();

// ── Security Middleware ───────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));
app.use(express.json({ limit: '10kb' }));
app.use(noSqlSanitizer);

// ── Rate Limiting ────────────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests', code: 'RATE_LIMIT_EXCEEDED' },
});
app.use('/api/', apiLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many auth attempts', code: 'AUTH_RATE_LIMIT' },
});
app.use('/api/auth/', authLimiter);

// ── Logging ──────────────────────────────────────────────────────────
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Health Check ─────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    dbState: ['disconnected', 'connected', 'connecting', 'disconnecting'][require('mongoose').connection.readyState],
  });
});

// ── REST Routes ──────────────────────────────────────────────────────
const authRoutes = require('./routes/auth');
const meetingRoutes = require('./routes/meetings');
app.use('/api/auth', authRoutes);
app.use('/api/meetings', meetingRoutes);

// ── Socket.IO ────────────────────────────────────────────────────────
const { initSocket } = require('./socket');
initSocket(server);

// ── Error Handler (must be last) ─────────────────────────────────────
app.use(errorHandler);

// ── Start Server ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
});

// ── Graceful Shutdown ────────────────────────────────────────────────
gracefulShutdown(server);
