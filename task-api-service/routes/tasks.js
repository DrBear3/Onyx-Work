import express from 'express';
import auth from '../middleware/auth.js';
import { body, param, query } from 'express-validator';
import { validate } from '../middleware/validate.js';
import * as tasksController from '../Controllers/tasksController.js';

const router = express.Router();

router.get(
  '/',
  auth,
  [
    query('folder_id').optional().isInt().withMessage('folder_id must be an integer')
  ],
  validate,
  tasksController.getTasks
);

router.post(
  '/',
  auth,
  [
    body('folder_id').isInt().withMessage('folder_id required'),
    body('title').isString().notEmpty().withMessage('title required')
  ],
  validate,
  tasksController.createTask
);

router.put(
  '/:id',
  auth,
  [param('id').isInt().withMessage('Invalid task id')],
  validate,
  tasksController.updateTask
);

router.delete(
  '/:id',
  auth,
  [param('id').isInt().withMessage('Invalid task id')],
  validate,
  tasksController.deleteTask
);

export default router;