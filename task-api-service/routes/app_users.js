import express from 'express';
import auth from '../middleware/auth.js';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';
import * as usersController from '../controllers/app_usersController.js';

const router = express.Router();

router.get('/me', auth, usersController.getCurrentUser);

router.get('/', auth, usersController.getAllUsers);

router.get('/:id', auth, usersController.getUserById);

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

router.delete(
  '/',
  auth,
  usersController.deleteUser
);

export default router;