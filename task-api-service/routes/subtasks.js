import express from 'express';
import auth from '../middleware/auth.js';
import { body, param, query } from 'express-validator';
import { validate } from '../middleware/validate.js';
import * as subtasksController from '../controllers/subtasksController.js';

const router = express.Router();

router.get('/', auth, subtasksController.getSubtasks);

router.get('/:id', auth, subtasksController.getSubtaskById);

router.post(
  '/',
  auth,
  [
    body('task_id').isUUID().withMessage('task_id must be a valid UUID'),
    body('title').isString().notEmpty().withMessage('title required')
  ],
  validate,
  subtasksController.createSubtask
);

router.put(
  '/:id',
  auth,
  [param('id').isUUID().withMessage('Invalid subtask id')],
  validate,
  subtasksController.updateSubtask
);

router.delete(
  '/:id',
  auth,
  [param('id').isUUID().withMessage('Invalid subtask id')],
  validate,
  subtasksController.deleteSubtask
);

export default router;