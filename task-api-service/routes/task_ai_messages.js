// routes/task_ai_messages.js
import express from 'express';
import auth from '../middleware/auth.js';
import { body, param, query } from 'express-validator';
import { validate } from '../middleware/validate.js';
import * as taskAiMessagesController from '../controllers/taskAiMessagesController.js';

const router = express.Router();

router.get('/', auth, taskAiMessagesController.getTaskAiMessages);

router.get('/:id', auth, taskAiMessagesController.getTaskAiMessageById);

router.post(
  '/',
  auth,
  [
    body('task_id').isUUID().withMessage('task_id must be a valid UUID'),
    body('message').isString().notEmpty().withMessage('message required'),
    body('from_user').isBoolean().withMessage('from_user must be a boolean'),
    body('from_ai').isBoolean().withMessage('from_ai must be a boolean')
  ],
  validate,
  taskAiMessagesController.createTaskAiMessage
);

router.put(
  '/:id',
  auth,
  [
    param('id').isUUID().withMessage('Invalid task AI message id'),
    body('message').optional().isString().notEmpty().withMessage('message must be a non-empty string'),
    body('from_user').optional().isBoolean().withMessage('from_user must be a boolean'),
    body('from_ai').optional().isBoolean().withMessage('from_ai must be a boolean')
  ],
  validate,
  taskAiMessagesController.updateTaskAiMessage
);

router.delete(
  '/:id',
  auth,
  [param('id').isUUID().withMessage('Invalid task AI message id')],
  validate,
  taskAiMessagesController.deleteTaskAiMessage
);

export default router;