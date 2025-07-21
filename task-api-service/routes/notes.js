import express from 'express';
import auth from '../middleware/auth.js';
import { body, param, query } from 'express-validator';
import { validate } from '../middleware/validate.js';
import * as notesController from '../controllers/notesController.js';

const router = express.Router();

router.get(
  '/',
  auth,
  [
    query('task_id').isInt().withMessage('task_id is required and must be an integer')
  ],
  validate,
  notesController.getNotes
);

router.post(
  '/',
  auth,
  [
    body('task_id').isInt().withMessage('task_id required'),
    body('content').isString().notEmpty().withMessage('content required')
  ],
  validate,
  notesController.createNote
);

router.put(
  '/:id',
  auth,
  [param('id').isInt().withMessage('Invalid note id')],
  validate,
  notesController.updateNote
);

router.delete(
  '/:id',
  auth,
  [param('id').isInt().withMessage('Invalid note id')],
  validate,
  notesController.deleteNote
);

export default router;