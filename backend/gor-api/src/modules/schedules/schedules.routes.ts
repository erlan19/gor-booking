import { Router } from 'express';
import { blockSlot, listBlocked, unblockSlot } from './schedules.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import { wrap } from '../../middlewares/error.middleware.js';

const router = Router();

router.get('/blocked', authenticate, requireRole('ADMIN', 'CLIENT'), wrap(listBlocked));
router.post('/block', authenticate, requireRole('ADMIN'), wrap(blockSlot));
router.delete('/blocked/:id', authenticate, requireRole('ADMIN'), wrap(unblockSlot));

export default router;
