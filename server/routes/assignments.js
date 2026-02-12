const express = require('express');
const { createAssignment, getAssignmentsByCourse, getAssignmentById } = require('../controllers/assignmentController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');
const { assignmentValidation, handleValidation } = require('../utils/validation');

const router = express.Router();
router.post('/', protect, authorize('faculty', 'admin'), assignmentValidation, handleValidation, createAssignment);
router.get('/single/:id', protect, getAssignmentById);
router.get('/:courseId', protect, getAssignmentsByCourse);
module.exports = router;
