import express from 'express';
import auth from '../middleware/auth.js';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validate.js';
import * as notesController from '../controllers/notesController.js';

const router = express.Router();

router.get('/', auth, notesController.getNotes);
router.get('/:id', auth, notesController.getNoteById);

router.post(
  '/',
  auth,
  [
    body('task_id').isUUID().withMessage('task_id must be a valid UUID'),
    body('content').isString().notEmpty().withMessage('content required')
  ],
  validate,
  notesController.createNote
);

router.put(
  '/:id',
  auth,
  [param('id').isUUID().withMessage('Invalid note id')],
  validate,
  notesController.updateNote
);

router.delete(
  '/:id',
  auth,
  [param('id').isUUID().withMessage('Invalid note id')],
  validate,
  notesController.deleteNote
);

router.post('/debug', (req, res) => res.json({message: "It works"}));

export default router;