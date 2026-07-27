import { Router } from 'express';
import { listCourts, getCourt, createCourt, updateCourt, deleteCourt } from './courts.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import { wrap } from '../../middlewares/error.middleware.js';

const router = Router();

router.get('/', wrap(listCourts));
router.get('/:id', wrap(getCourt));
router.post('/', authenticate, requireRole('ADMIN'), wrap(createCourt));
router.patch('/:id', authenticate, requireRole('ADMIN'), wrap(updateCourt));
router.delete('/:id', authenticate, requireRole('ADMIN'), wrap(deleteCourt));

export default router;
