const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { PrismaClient } = require('@prisma/client');
const { env } = require('./config/env');
const { errorHandler } = require('./middlewares/error.middleware');
const authRoutes = require('./modules/auth/auth.routes');
const bookingRoutes = require('./modules/bookings/bookings.routes');
const courtRoutes = require('./modules/courts/courts.routes');
const paymentRoutes = require('./modules/payments/payments.routes');
const scheduleRoutes = require('./modules/schedules/schedules.routes');
const userRoutes = require('./modules/users/users.routes');
const adminRoutes = require('./modules/admin/admin.routes');

const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '1mb' }));

// Diagnostic endpoint — reveals DB connection status from inside Railway
app.get('/api/v1/debug', async (_req, res) => {
  const dbUrl = process.env.DATABASE_URL || '(not set)';
  const info: Record<string, unknown> = {
    node: process.version,
    env: process.env.RAILWAY_ENVIRONMENT || 'unknown',
    service: process.env.RAILWAY_SERVICE_NAME || 'unknown',
    dbUrl: dbUrl.substring(0, 80) + '...',
  };
  try {
    const p = new PrismaClient();
    await p.$queryRawUnsafe('SELECT 1 as ok');
    info.dbStatus = 'connected';
    await p.$disconnect();
  } catch (e: unknown) {
    info.dbStatus = 'error';
    info.dbError = e instanceof Error ? e.message.substring(0, 200) : String(e);
  }
  res.json(info);
});

// Health check
app.get('/api/v1/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/courts', courtRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/schedules', scheduleRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/admin', adminRoutes);

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;
