import express from 'express';
import auth from '../middleware/auth.js';
import { body, param, query } from 'express-validator';
import { validate } from '../middleware/validate.js';
import * as tasksController from '../controllers/tasksController.js';

const router = express.Router();

// Get tasks with enhanced query parameters
router.get('/', 
  auth,
  [
    query('folder_id').optional().isUUID().withMessage('folder_id must be a valid UUID'),
    query('status').optional().isIn(['completed', 'pending']).withMessage('status must be completed or pending'),
    query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
    query('sort_by').optional().isIn(['created_at', 'updated_at', 'title', 'due_date']).withMessage('invalid sort field'),
    query('sort_order').optional().isIn(['ASC', 'DESC', 'asc', 'desc']).withMessage('sort_order must be ASC or DESC')
  ],
  validate,
  tasksController.getTasks
);

// Get single task
router.get('/:id', 
  auth,
  [param('id').isInt().withMessage('Invalid task id')],
  validate,
  tasksController.getTaskById
);

// Create new task with enhanced validation
router.post('/',
  auth,
  [
    body('folder_id').optional().isUUID().withMessage('folder_id must be a valid UUID'),
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
    body('due_date')
      .optional()
      .isISO8601()
      .withMessage('due_date must be a valid date'),
    body('is_repeating')
      .optional()
      .isBoolean()
      .withMessage('is_repeating must be a boolean')
  ],
  validate,
  tasksController.createTask
);

// Update task
router.put('/:id',
  auth,
  [
    param('id').isInt().withMessage('Invalid task id'),
    body('title')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('title must be between 1 and 200 characters'),
    body('description')
      .optional()
      .isString()
      .isLength({ max: 1000 })
      .withMessage('description cannot exceed 1000 characters'),
    body('due_date')
      .optional()
      .isISO8601()
      .withMessage('due_date must be a valid date'),
    body('is_repeating')
      .optional()
      .isBoolean()
      .withMessage('is_repeating must be a boolean'),
    body('completed_at')
      .optional()
      .isISO8601()
      .withMessage('completed_at must be a valid date')
  ],
  validate,
  tasksController.updateTask
);

// Toggle task completion status
router.patch('/:id/toggle',
  auth,
  [param('id').isInt().withMessage('Invalid task id')],
  validate,
  tasksController.toggleTaskCompletion
);

// Delete task
router.delete('/:id',
  auth,
  [param('id').isInt().withMessage('Invalid task id')],
  validate,
  tasksController.deleteTask
);

export default router;