const { Router } = require('express');
const { blockSlot, listBlocked, unblockSlot } = require('./schedules.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');
const { wrap } = require('../../middlewares/error.middleware');

const router = Router();

router.get('/blocked', authenticate, requireRole('ADMIN', 'CLIENT'), wrap(listBlocked));
router.post('/block', authenticate, requireRole('ADMIN'), wrap(blockSlot));
router.delete('/blocked/:id', authenticate, requireRole('ADMIN'), wrap(unblockSlot));

module.exports = router;
