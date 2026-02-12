const express = require('express');
const { createCourse, getCourses, getCourseById } = require('../controllers/courseController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');
const { courseValidation, handleValidation } = require('../utils/validation');

const router = express.Router();
router.post('/', protect, authorize('faculty', 'admin'), courseValidation, handleValidation, createCourse);
router.get('/', protect, getCourses);
router.get('/:id', protect, getCourseById);
module.exports = router;
