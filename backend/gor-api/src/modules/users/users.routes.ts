import { Router } from 'express';
import { listUsers, toggleUserStatus } from './users.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import { wrap } from '../../middlewares/error.middleware.js';

const router = Router();

router.get('/', authenticate, requireRole('ADMIN'), wrap(listUsers));
router.patch('/:id/toggle', authenticate, requireRole('ADMIN'), wrap(toggleUserStatus));

export default router;
