const { Router } = require('express');
const { listUsers, toggleUserStatus } = require('./users.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');
const { wrap } = require('../../middlewares/error.middleware');

const router = Router();

router.get('/', authenticate, requireRole('ADMIN'), wrap(listUsers));
router.patch('/:id/toggle', authenticate, requireRole('ADMIN'), wrap(toggleUserStatus));

module.exports = router;
