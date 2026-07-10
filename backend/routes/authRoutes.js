const express = require('express');
const { body } = require('express-validator');
const { register, verifyEmail, login, forgotPassword, resetPassword, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.post(
  '/register',
  [
    body('name', 'Name is required').notEmpty().trim(),
    body('email', 'Please include a valid email').isEmail().normalizeEmail(),
    body('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
    validate,
  ],
  register
);

router.get('/verify/:token', verifyEmail);

router.post(
  '/login',
  [
    body('email', 'Please include a valid email').isEmail().normalizeEmail(),
    body('password', 'Password is required').exists(),
    validate,
  ],
  login
);

router.post(
  '/forgot-password',
  [body('email', 'Please include a valid email').isEmail().normalizeEmail(), validate],
  forgotPassword
);

router.post(
  '/reset-password/:token',
  [body('password', 'Password must be at least 6 characters').isLength({ min: 6 }), validate],
  resetPassword
);

router.get('/me', protect, getMe);

module.exports = router;
