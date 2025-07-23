// routes/task_ai_messages.js
import express from 'express';
import auth from '../middleware/auth.js';
import { body, param, query } from 'express-validator';
import { validate } from '../middleware/validate.js';
import * as task_ai_messagesController from '../controllers/task_ai_messagesController.js';

const router = express.Router();

router.get('/', auth, task_ai_messagesController.getTaskAiMessages);

router.get('/:id', auth, task_ai_messagesController.getTaskAiMessageById);

router.post(
  '/',
  auth,
  [
    body('task_id').isInt().withMessage('task_id must be a valid integer'),
    body('message')
      .isString()
      .trim()
      .isLength({ min: 1, max: 2000 })
      .withMessage('message is required and must be between 1 and 2000 characters'),
    body('from_user').optional().isBoolean().withMessage('from_user must be a boolean'),
    body('from_ai').optional().isBoolean().withMessage('from_ai must be a boolean')
  ],
  validate,
  task_ai_messagesController.createTaskAiMessage
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
  task_ai_messagesController.updateTaskAiMessage
);

router.delete(
  '/:id',
  auth,
  [param('id').isUUID().withMessage('Invalid task AI message id')],
  validate,
  task_ai_messagesController.deleteTaskAiMessage
);

export default router;