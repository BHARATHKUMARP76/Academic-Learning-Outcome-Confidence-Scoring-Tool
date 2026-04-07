const express = require('express');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');
const { upload } = require('../middleware/upload');
const { achievementRecordValidation, handleValidation } = require('../utils/validation');
const {
  createAchievement,
  getMyAchievements,
  getAllAchievements
} = require('../controllers/achievementController');

const router = express.Router();

// Wrap multer to send clean JSON errors instead of crashing
const uploadCertificate = (req, res, next) => {
  req.uploadContext = 'achievement';
  upload.single('certificate')(req, res, (err) => {
    if (err) {
      // Multer or filesystem error (e.g. wrong type, ENOENT, size limits)
      return res
        .status(400)
        .json({ message: err.message || 'File upload failed. Please upload a valid PDF certificate.' });
    }
    next();
  });
};

// student submissions
router.post(
  '/',
  protect,
  authorize('student'),
  uploadCertificate,
  achievementRecordValidation,
  handleValidation,
  createAchievement
);

router.get('/me', protect, authorize('student'), getMyAchievements);

// faculty/admin review
router.get('/', protect, authorize('faculty', 'admin'), getAllAchievements);

module.exports = router;

