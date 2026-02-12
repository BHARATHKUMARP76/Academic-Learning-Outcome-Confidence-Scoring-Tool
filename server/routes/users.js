const express = require('express');
const { getAllUsers } = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

const router = express.Router();
router.get('/', protect, authorize('admin'), getAllUsers);
module.exports = router;
