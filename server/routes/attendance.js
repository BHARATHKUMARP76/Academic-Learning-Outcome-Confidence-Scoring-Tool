const express = require('express');
const { getAttendanceByCourse, getMyAttendance, setAttendance } = require('../controllers/attendanceController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');
const { attendanceValidation, handleValidation } = require('../utils/validation');

const router = express.Router();
router.get('/me', protect, getMyAttendance);
router.get('/course/:courseId', protect, getAttendanceByCourse);
router.put('/', protect, authorize('faculty', 'admin'), attendanceValidation, handleValidation, setAttendance);
module.exports = router;
