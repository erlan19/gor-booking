const { Router } = require('express');
import {
  listBookings,
  createBooking,
  createBookingWalkin,
  listMyBookings,
  getBooking,
  cancelBooking,
  rescheduleBooking,
} from './bookings.controller.js';
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');
const { wrap } = require('../../middlewares/error.middleware');

const router = Router();

// GET /bookings -- list bookings by date (schedule grid)
router.get('/', authenticate, requireRole('CLIENT', 'CASHIER', 'ADMIN'), wrap(listBookings));

// POST /bookings -- client online booking (gateway payment)
router.post('/', authenticate, requireRole('CLIENT'), wrap(createBooking));

// POST /bookings/walkin -- cashier walk-in booking
router.post('/walkin', authenticate, requireRole('CASHIER', 'ADMIN'), wrap(createBookingWalkin));

// GET /bookings/me -- client's own bookings
router.get('/me', authenticate, requireRole('CLIENT'), wrap(listMyBookings));

// GET /bookings/:id -- booking detail (client: own only, cashier: any)
router.get('/:id', authenticate, requireRole('CLIENT', 'CASHIER'), wrap(getBooking));

// PATCH /bookings/:id/cancel -- cancel (client: own, cashier/admin: any)
router.patch('/:id/cancel', authenticate, requireRole('CLIENT', 'CASHIER', 'ADMIN'), wrap(cancelBooking));

// PATCH /bookings/:id/reschedule -- client reschedule own booking
router.patch('/:id/reschedule', authenticate, requireRole('CLIENT'), wrap(rescheduleBooking));

module.exports = router;
