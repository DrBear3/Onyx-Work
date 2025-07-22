// routes/suggested_tasks.js
import express from 'express';
import auth from '../middleware/auth.js';
import { body, param, query } from 'express-validator';
import { validate } from '../middleware/validate.js';
import * as suggested_tasksController from '../controllers/suggested_tasksController.js';

const router = express.Router();

router.get('/', auth, suggested_tasksController.getSuggestedTasks);

router.get('/:id', auth, suggested_tasksController.getSuggestedTaskById);

router.post(
  '/',
  auth,
  [
    body('suggestion_batch_id').isUUID().withMessage('suggestion_batch_id must be a valid UUID'),
    body('title').isString().notEmpty().withMessage('title required'),
    body('is_added').optional().isBoolean().withMessage('is_added must be a boolean')
  ],
  validate,
  suggested_tasksController.createSuggestedTask
);

router.put(
  '/:id',
  auth,
  [
    param('id').isUUID().withMessage('Invalid suggested task id'),
    body('title').optional().isString().notEmpty().withMessage('title must be a non-empty string'),
    body('is_added').optional().isBoolean().withMessage('is_added must be a boolean')
  ],
  validate,
  suggested_tasksController.updateSuggestedTask
);

router.delete(
  '/:id',
  auth,
  [param('id').isUUID().withMessage('Invalid suggested task id')],
  validate,
  suggested_tasksController.deleteSuggestedTask
);

export default router;