import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { errorHandler } from './middlewares/error.middleware.js';
import authRoutes from './modules/auth/auth.routes.js';
import bookingRoutes from './modules/bookings/bookings.routes.js';
import courtRoutes from './modules/courts/courts.routes.js';
import paymentRoutes from './modules/payments/payments.routes.js';
import scheduleRoutes from './modules/schedules/schedules.routes.js';
import userRoutes from './modules/users/users.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '1mb' }));

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

export default app;
