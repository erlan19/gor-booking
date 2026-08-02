const { Router } = require('express');
import {
  createMidtransTransaction,
  createDummyPayment,
  handleWebhook,
  confirmCashPayment,
} from './payments.controller.js';
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');
const { wrap } = require('../../middlewares/error.middleware');

const router = Router();

router.post('/create', authenticate, requireRole('CLIENT'), wrap(createMidtransTransaction));
router.post('/dummy', authenticate, requireRole('CLIENT'), wrap(createDummyPayment));
router.post('/webhook', wrap(handleWebhook));
router.post('/confirm', authenticate, requireRole('CASHIER', 'ADMIN'), wrap(confirmCashPayment));

module.exports = router;
