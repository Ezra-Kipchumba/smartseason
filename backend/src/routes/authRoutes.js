/**
 * authRoutes.js
 */

const router = require('express').Router();
const { body } = require('express-validator');
const { register, login, getMe } = require('../controllers/authController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');

// Login — open to everyone
router.post('/login', [
  body('email').isEmail().withMessage('Valid email required.'),
  body('password').notEmpty().withMessage('Password required.'),
  validate,
], login);

// Register — only admins can create new users via this endpoint
router.post('/register', authenticate, requireAdmin, [
  body('name').notEmpty().withMessage('Name required.'),
  body('email').isEmail().withMessage('Valid email required.'),
  body('password').isLength({ min: 6 }).withMessage('Password min 6 chars.'),
  validate,
], register);

// Get current user profile
router.get('/me', authenticate, getMe);

module.exports = router;
