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
    body('gmail').optional().isString().withMessage('gmail must be a string')
  ],
  validate,
  integrationsController.createIntegration
);

router.put(
  '/:id',
  auth,
  [
    param('id').isInt().withMessage('Invalid integration id'),
    body('gmail').optional().isString()
  ],
  validate,
  integrationsController.updateIntegration
);

router.delete(
  '/:id',
  auth,
  [param('id').isInt().withMessage('Invalid integration id')],
  validate,
  integrationsController.deleteIntegration
);

export default router;