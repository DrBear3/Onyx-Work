import express from 'express';
import auth from '../middleware/auth.js';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validate.js';
import * as gmailController from '../controllers/gmailIntegrationController.js';

const router = express.Router();

// Check Gmail integration permission for user
router.get('/permission',
  auth,
  gmailController.checkGmailPermission
);

// Get Gmail integration summary for user
router.get('/summary',
  auth,
  gmailController.getGmailIntegrationSummary
);

// Get Gmail integration status for a specific task
router.get('/task/:taskId/status',
  auth,
  [
    param('taskId')
      .isUUID()
      .withMessage('taskId must be a valid UUID')
  ],
  validate,
  gmailController.getTaskGmailStatus
);

// Toggle Gmail integration for a specific task
router.post('/task/:taskId/toggle',
  auth,
  [
    param('taskId')
      .isUUID()
      .withMessage('taskId must be a valid UUID'),
    body('enabled')
      .isBoolean()
      .withMessage('enabled must be a boolean')
  ],
  validate,
  gmailController.toggleTaskGmailIntegration
);

// Handle Gmail OAuth callback
router.post('/oauth-callback',
  auth,
  [
    body('taskId')
      .optional()
      .isUUID()
      .withMessage('taskId must be a valid UUID'),
    body('granted')
      .optional()
      .isBoolean()
      .withMessage('granted must be a boolean')
  ],
  validate,
  gmailController.handleGmailOAuthCallback
);

export default router;
