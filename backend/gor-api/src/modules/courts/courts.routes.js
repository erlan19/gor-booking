const { Router } = require('express');
const { listCourts, getCourt, createCourt, updateCourt, deleteCourt } = require('./courts.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');
const { wrap } = require('../../middlewares/error.middleware');

const router = Router();

router.get('/', wrap(listCourts));
router.get('/:id', wrap(getCourt));
router.post('/', authenticate, requireRole('ADMIN'), wrap(createCourt));
router.patch('/:id', authenticate, requireRole('ADMIN'), wrap(updateCourt));
router.delete('/:id', authenticate, requireRole('ADMIN'), wrap(deleteCourt));

module.exports = router;
