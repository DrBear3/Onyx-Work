import express from 'express';
import auth from '../middleware/auth.js';
import { body, param, query } from 'express-validator';
import { validate } from '../middleware/validate.js';
import * as tasksController from '../controllers/tasksController.js';

const router = express.Router();

router.get('/', auth, tasksController.getTasks);

router.get('/:id', auth, tasksController.getTaskById);

router.post(
  '/',
  auth,
  [
    body('folder_id').optional().isUUID().withMessage('folder_id must be a valid UUID'),
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