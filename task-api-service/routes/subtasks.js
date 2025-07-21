import express from 'express';
import auth from '../middleware/auth.js';
import { body, param, query } from 'express-validator';
import { validate } from '../middleware/validate.js';
import * as subtasksController from '../controllers/subtasksController.js';

const router = express.Router();

router.get(
  '/',
  auth,
  [
    query('task_id').isInt().withMessage('task_id is required and must be an integer')
  ],
  validate,
  subtasksController.getSubtasks
);

router.post(
  '/',
  auth,
  [
    body('task_id').isInt().withMessage('task_id required'),
    body('title').isString().notEmpty().withMessage('title required')
  ],
  validate,
  subtasksController.createSubtask
);

router.put(
  '/:id',
  auth,
  [param('id').isInt().withMessage('Invalid subtask id')],
  validate,
  subtasksController.updateSubtask
);

router.delete(
  '/:id',
  auth,
  [param('id').isInt().withMessage('Invalid subtask id')],
  validate,
  subtasksController.deleteSubtask
);

export default router;