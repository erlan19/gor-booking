import { Router } from 'express';
import { getAllBookings, getReport } from './admin.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import { wrap } from '../../middlewares/error.middleware.js';

const router = Router();

router.get('/bookings', authenticate, requireRole('ADMIN'), wrap(getAllBookings));
router.get('/reports', authenticate, requireRole('ADMIN'), wrap(getReport));

export default router;
