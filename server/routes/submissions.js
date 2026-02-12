const express = require('express');
const {
  createSubmission,
  getSubmissionsByStudent,
  getSubmissionsByCourse,
  getSubmissionById
} = require('../controllers/submissionController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');
const { submissionValidation, handleValidation } = require('../utils/validation');

const router = express.Router();
router.post('/', protect, authorize('student'), submissionValidation, handleValidation, createSubmission);
router.get('/student/:id', protect, getSubmissionsByStudent);
router.get('/course/:id', protect, authorize('faculty', 'admin'), getSubmissionsByCourse);
router.get('/:id', protect, getSubmissionById);
module.exports = router;
