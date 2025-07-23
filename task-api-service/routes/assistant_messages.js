// routes/assistant_messages.js
import express from 'express';
import auth from '../middleware/auth.js';
import { body, param, query } from 'express-validator';
import { validate } from '../middleware/validate.js';
import * as assistant_messagesController from '../controllers/assistant_messagesController.js';

const router = express.Router();

router.get('/', auth, assistant_messagesController.getAssistantMessages);

router.get('/:id', auth, assistant_messagesController.getAssistantMessageById);

router.post(
  '/',
  auth,
  [
    body('message')
      .isString()
      .trim()
      .isLength({ min: 1, max: 2000 })
      .withMessage('message is required and must be between 1 and 2000 characters'),
    body('from_user').optional().isBoolean().withMessage('from_user must be a boolean'),
    body('from_ai').optional().isBoolean().withMessage('from_ai must be a boolean'),
    body('view_context').optional().isObject().withMessage('view_context must be an object'),
    body('view_context.current_view').optional().isString().withMessage('current_view must be a string'),
    body('view_context.visible_task_ids').optional().isArray().withMessage('visible_task_ids must be an array'),
    body('view_context.visible_folder_ids').optional().isArray().withMessage('visible_folder_ids must be an array'),
    body('view_context.current_folder_id').optional().isInt().withMessage('current_folder_id must be an integer')
  ],
  validate,
  assistant_messagesController.createAssistantMessage
);

router.put(
  '/:id',
  auth,
  [
    param('id').isUUID().withMessage('Invalid assistant message id'),
    body('message').optional().isString().notEmpty().withMessage('message must be a non-empty string'),
    body('from_user').optional().isBoolean().withMessage('from_user must be a boolean'),
    body('from_ai').optional().isBoolean().withMessage('from_ai must be a boolean')
  ],
  validate,
  assistant_messagesController.updateAssistantMessage
);

router.delete(
  '/:id',
  auth,
  [param('id').isUUID().withMessage('Invalid assistant message id')],
  validate,
  assistant_messagesController.deleteAssistantMessage
);

export default router;