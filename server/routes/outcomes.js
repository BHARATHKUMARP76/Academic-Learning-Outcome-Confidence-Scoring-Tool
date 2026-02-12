const express = require('express');
const { createOutcome, getOutcomesByCourse } = require('../controllers/outcomeController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');
const { outcomeValidation, handleValidation } = require('../utils/validation');

const router = express.Router();
router.post('/', protect, authorize('faculty', 'admin'), outcomeValidation, handleValidation, createOutcome);
router.get('/:courseId', protect, getOutcomesByCourse);
module.exports = router;
