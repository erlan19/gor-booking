const { Router } = require('express');
const { getAllBookings, getReport } = require('./admin.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');
const { wrap } = require('../../middlewares/error.middleware');

const router = Router();

router.get('/bookings', authenticate, requireRole('ADMIN'), wrap(getAllBookings));
router.get('/reports', authenticate, requireRole('ADMIN'), wrap(getReport));

module.exports = router;
