import express from 'express';
import auth from '../middleware/auth.js';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validate.js';
import * as foldersController from '../controllers/foldersController.js';

const router = express.Router();

router.get('/', auth, foldersController.getFolders);

router.post(
  '/',
  auth,
  [body('name').isString().notEmpty().withMessage('Folder name is required')],
  validate,
  foldersController.createFolder
);

router.put(
  '/:id',
  auth,
  [param('id').isInt().withMessage('Invalid folder id')],
  validate,
  foldersController.updateFolder
);

router.delete(
  '/:id',
  auth,
  [param('id').isInt().withMessage('Invalid folder id')],
  validate,
  foldersController.deleteFolder
);

export default router;