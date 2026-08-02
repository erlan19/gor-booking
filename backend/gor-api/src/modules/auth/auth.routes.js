const { Router } = require('express');
const { register, login, me } = require('./auth.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { wrap } = require('../../middlewares/error.middleware');
const { loginLimiter } = require('../../middlewares/rateLimit.middleware');

const router = Router();

router.post('/register', wrap(register));
router.post('/login', loginLimiter, wrap(login));
router.get('/me', authenticate, wrap(me));

module.exports = router;
