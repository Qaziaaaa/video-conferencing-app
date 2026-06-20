const mongoose = require('mongoose');

const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${err.name}: ${err.message}`);
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: 'Validation failed', code: 'VALIDATION_ERROR' });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid ID format', code: 'CAST_ERROR' });
  }

  if (err.code === 11000) {
    return res.status(409).json({ error: 'Duplicate key', code: 'DUPLICATE_KEY' });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    code: err.code || 'INTERNAL_ERROR',
  });
};

process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Unhandled rejection:', reason);
});

const gracefulShutdown = (server) => {
  const shutdown = async (signal) => {
    console.log(`\n[SHUTDOWN] ${signal} received. Closing connections...`);
    server.close(() => {
      console.log('[SHUTDOWN] HTTP server closed.');
      mongoose.connection.close(false).then(() => {
        console.log('[SHUTDOWN] MongoDB disconnected.');
        process.exit(0);
      });
    });
    setTimeout(() => {
      console.error('[SHUTDOWN] Forced exit after timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

module.exports = { errorHandler, gracefulShutdown };
