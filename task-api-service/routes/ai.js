import express from 'express';
import auth from '../middleware/auth.js';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';
import * as aiController from '../controllers/aiController.js';

const router = express.Router();

// Process AI message with subscription-aware handling
router.post('/message',
  auth,
  [
    body('message_content')
      .isString()
      .trim()
      .isLength({ min: 1, max: 2000 })
      .withMessage('message_content is required and must be between 1 and 2000 characters'),
    body('message_type')
      .isIn(['task_specific', 'general_assistant'])
      .withMessage('message_type must be either "task_specific" or "general_assistant"'),
    body('task_id')
      .optional()
      .isUUID()
      .withMessage('task_id must be a valid UUID'),
    body('view_context')
      .optional()
      .isObject()
      .withMessage('view_context must be an object')
  ],
  validate,
  aiController.processAIMessage
);

// Get subscription status and usage
router.get('/subscription-status',
  auth,
  aiController.getSubscriptionStatus
);

// Generate a single AI task suggestion (with subscription check)
router.get('/suggestion',
  auth,
  aiController.generateTaskSuggestion
);

// Parse natural language due date (with subscription check)
router.post('/parse-date',
  auth,
  [
    body('date_input')
      .isString()
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('date_input is required and must be between 1 and 200 characters')
  ],
  validate,
  aiController.parseDueDate
);

// Create onboarding tasks for new user
router.post('/onboarding-tasks',
  auth,
  [
    body('folder_id')
      .optional()
      .isUUID()
      .withMessage('folder_id must be a valid UUID')
  ],
  validate,
  aiController.createOnboardingTasks
);

// Create task with AI-enhanced due date parsing
router.post('/create-task-smart',
  auth,
  [
    body('folder_id')
      .optional()
      .isUUID()
      .withMessage('folder_id must be a valid UUID'),
    body('title')
      .isString()
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('title is required and must be between 1 and 200 characters'),
    body('description')
      .optional()
      .isString()
      .isLength({ max: 1000 })
      .withMessage('description cannot exceed 1000 characters'),
    body('due_date_input')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('due_date_input must be between 1 and 200 characters'),
    body('is_repeating')
      .optional()
      .isBoolean()
      .withMessage('is_repeating must be a boolean')
  ],
  validate,
  aiController.createTaskWithAIParsing
);

export default router;
