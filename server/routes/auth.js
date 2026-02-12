const express = require('express');
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { registerValidation, loginValidation, handleValidation } = require('../utils/validation');

const router = express.Router();
router.post('/register', registerValidation, handleValidation, register);
router.post('/login', loginValidation, handleValidation, login);
router.get('/me', protect, getMe);
module.exports = router;
