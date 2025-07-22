// routes/integrations.js
import express from 'express';
import auth from '../middleware/auth.js';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validate.js';
import * as integrationsController from '../controllers/integrationsController.js';

const router = express.Router();

router.get('/', auth, integrationsController.getIntegrations);

router.get('/:id', auth, integrationsController.getIntegrationById);

router.post(
  '/',
  auth,
  [
    body('gmail').optional().isBoolean().withMessage('gmail must be a boolean'),
    body('status').optional().isBoolean().withMessage('status must be a boolean')
  ],
  validate,
  integrationsController.createIntegration
);

router.put(
  '/:id',
  auth,
  [
    param('id').isUUID().withMessage('Invalid integration id'),
    body('gmail').optional().isBoolean().withMessage('gmail must be a boolean'),
    body('status').optional().isBoolean().withMessage('status must be a boolean')
  ],
  validate,
  integrationsController.updateIntegration
);

export default router;