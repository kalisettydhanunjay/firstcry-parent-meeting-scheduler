const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, requireRole } = require('../middleware/auth');

// Admin-specific routes
router.get('/dashboard', verifyToken, requireRole(['admin']), adminController.getDashboardMetrics);
router.get('/meetings', verifyToken, requireRole(['admin']), adminController.getAllMeetings);
router.put('/meeting/:id', verifyToken, requireRole(['admin']), adminController.updateMeeting);

// Helper route to get all teachers (accessible by both Admin and Parent users)
router.get('/teachers', verifyToken, requireRole(['admin', 'parent']), adminController.getAllTeachers);

module.exports = router;
