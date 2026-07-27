import { Router } from 'express';
import {
  createMidtransTransaction,
  handleWebhook,
  confirmCashPayment,
} from './payments.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import { wrap } from '../../middlewares/error.middleware.js';

const router = Router();

router.post('/create', authenticate, requireRole('CLIENT'), wrap(createMidtransTransaction));
router.post('/webhook', wrap(handleWebhook));
router.post('/confirm', authenticate, requireRole('CASHIER', 'ADMIN'), wrap(confirmCashPayment));

export default router;
