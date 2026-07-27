import { Router } from 'express';
import { register, login, me } from './auth.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { wrap } from '../../middlewares/error.middleware.js';
import { loginLimiter } from '../../middlewares/rateLimit.middleware.js';

const router = Router();

router.post('/register', wrap(register));
router.post('/login', loginLimiter, wrap(login));
router.get('/me', authenticate, wrap(me));

export default router;
