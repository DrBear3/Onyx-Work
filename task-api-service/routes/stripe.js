import express from 'express';
import auth from '../middleware/auth.js';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';
import * as stripeController from '../controllers/stripeController.js';

const router = express.Router();

// Create a Checkout session for Premium or Plaid subscription
router.post(
  '/create-checkout-session',
  auth,
  [
    body('userId').isUUID().withMessage('userId must be a valid UUID'),
    body('priceId').isString().notEmpty().withMessage('priceId required')
  ],
  validate,
  stripeController.createCheckoutSession
);

// Create a customer portal session for managing subscriptions
router.post(
  '/customer-portal',
  auth,
  [body('userId').isUUID().withMessage('userId must be a valid UUID')],
  validate,
  stripeController.createPortalSession
);

// Webhook to handle Stripe events (no auth, raw body)
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  stripeController.handleWebhook
);

export default router;