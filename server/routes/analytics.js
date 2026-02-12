const express = require('express');
const {
  studentAnalytics,
  courseAnalytics,
  institutionAnalytics
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

const router = express.Router();
router.get('/student/:id', protect, studentAnalytics);
router.get('/course/:id', protect, authorize('faculty', 'admin'), courseAnalytics);
router.get('/institution', protect, authorize('admin'), institutionAnalytics);
module.exports = router;
