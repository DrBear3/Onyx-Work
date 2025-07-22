// routes/assistant_messages.js
import express from 'express';
import auth from '../middleware/auth.js';
import { body, param, query } from 'express-validator';
import { validate } from '../middleware/validate.js';
import * as assistantMessagesController from '../controllers/assistantMessagesController.js';

const router = express.Router();

router.get('/', auth, assistant_messagesController.getAssistantMessages);

router.get('/:id', auth, assistant_messagesController.getAssistantMessageById);

router.post(
  '/',
  auth,
  [
    body('message').isString().notEmpty().withMessage('message required'),
    body('from_user').isBoolean().withMessage('from_user must be a boolean'),
    body('from_ai').isBoolean().withMessage('from_ai must be a boolean')
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