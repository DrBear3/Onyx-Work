import express from 'express';
import auth from '../middleware/auth.js';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';
import * as usersController from '../controllers/usersController.js';

const router = express.Router();

// Get current user info (profile)
router.get('/me', auth, usersController.getCurrentUser);

// Create a new user (signup, Magic.link registration)
router.post(
  '/',
  auth,
  [
    body('email').isEmail().withMessage('Email is required'),
    body('auth_method').isString().notEmpty().withMessage('auth_method is required'),
    body('subscription').optional().isString(),
  ],
  validate,
  usersController.createUser
);

// Update user profile
router.put(
  '/',
  auth,
  [
    body('email').optional().isEmail(),
    body('subscription').optional().isString(),
    body('auth_method').optional().isString(),
  ],
  validate,
  usersController.updateUser
);

// Soft-delete current user
router.delete(
  '/',
  auth,
  usersController.deleteUser
);

export default router;