const express = require('express');
const router = express.Router();
const meetingController = require('../controllers/meetingController');
const { verifyToken, requireRole } = require('../middleware/auth');

// Teacher-specific routes
router.get('/meetings', verifyToken, requireRole(['teacher']), meetingController.getTeacherMeetings);
router.put('/approve/:id', verifyToken, requireRole(['teacher']), meetingController.approveMeeting);
router.put('/reject/:id', verifyToken, requireRole(['teacher']), meetingController.rejectMeeting);
router.put('/reschedule/:id', verifyToken, requireRole(['teacher']), meetingController.rescheduleMeeting);
router.put('/notes/:id', verifyToken, requireRole(['teacher']), meetingController.addMeetingNotes);

module.exports = router;
