const express = require('express');
const router = express.Router();
const meetingController = require('../controllers/meetingController');
const { verifyToken, requireRole } = require('../middleware/auth');

// Parent-specific routes
router.post('/', verifyToken, requireRole(['parent']), meetingController.createMeeting);
router.get('/my', verifyToken, requireRole(['parent']), meetingController.getMyMeetings);
router.delete('/:id', verifyToken, requireRole(['parent']), meetingController.cancelMeeting);
router.put('/reschedule/:id', verifyToken, requireRole(['parent']), meetingController.parentRescheduleMeeting);

module.exports = router;
