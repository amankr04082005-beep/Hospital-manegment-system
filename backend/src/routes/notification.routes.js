const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/notification.controller');

const router = express.Router();
router.use(authenticate);

router.get('/', ctrl.getNotifications);
router.patch('/:id/read', ctrl.markRead);
router.patch('/read-all', ctrl.markAllRead);

module.exports = router;
