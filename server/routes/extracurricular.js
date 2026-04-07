const express = require('express');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');
const { upload } = require('../middleware/upload');
const { extracurricularRecordValidation, handleValidation } = require('../utils/validation');
const {
  createExtracurricular,
  getMyExtracurricular,
  getAllExtracurricular
} = require('../controllers/extracurricularController');

const router = express.Router();

// student submissions
router.post(
  '/',
  protect,
  authorize('student'),
  (req, _res, next) => {
    req.uploadContext = 'activity';
    next();
  },
  upload.single('proof'),
  extracurricularRecordValidation,
  handleValidation,
  createExtracurricular
);

router.get('/me', protect, authorize('student'), getMyExtracurricular);

// faculty/admin review
router.get('/', protect, authorize('faculty', 'admin'), getAllExtracurricular);

module.exports = router;

