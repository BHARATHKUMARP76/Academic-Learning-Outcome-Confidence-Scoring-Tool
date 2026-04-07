const express = require('express');
const { getAllUsers, getStudents } = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

const router = express.Router();
router.get('/', protect, authorize('admin'), getAllUsers);
router.get('/students', protect, authorize('faculty', 'admin'), getStudents);
module.exports = router;
