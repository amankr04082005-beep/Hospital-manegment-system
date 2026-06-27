const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');
const ctrl = require('../controllers/appointment.controller');

const router = express.Router();

router.use(authenticate);

router.post('/', authorize('appointment:create'), ctrl.bookAppointment);
router.get('/today', authorize('appointment:view-all'), ctrl.getTodaysAppointments);
router.get('/mine', authorize('appointment:view-own'), ctrl.getMyAppointments);
router.patch('/:id/status', authorize('appointment:view-all'), ctrl.updateStatus);
router.patch('/:id/reschedule', authorize('appointment:reschedule'), ctrl.reschedule);
router.post('/:id/forward', authorize('appointment:forward'), ctrl.forwardToDoctor);

module.exports = router;
