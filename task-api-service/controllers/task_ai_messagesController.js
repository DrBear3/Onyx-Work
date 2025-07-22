// controllers/taskAiMessagesController.js
import pool from '../db/pool.js';

// List task AI messages for the user, optionally filtered by task_id
export const getTaskAiMessages = async (req, res, next) => {
  try {
    const { issuer } = req.user;
    const { task_id } = req.query;
    let rows;
    if (task_id) {
      const result = await pool.query(
        'SELECT * FROM task_ai_messages WHERE task_id = $1 AND user_id = $2 ORDER BY created_at DESC',
        [task_id, issuer]
      );
      rows = result.rows;
    } else {
      const result = await pool.query(
        'SELECT * FROM task_ai_messages WHERE user_id = $1 ORDER BY created_at DESC',
        [issuer]
      );
      rows = result.rows;
    }
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

// Get a single task AI message by id
export const getTaskAiMessageById = async (req, res, next) => {
  try {
    const { issuer } = req.user;
    const { id } = req.params;
    const { rows } = await pool.query(
      'SELECT * FROM task_ai_messages WHERE id = $1 AND user_id = $2',
      [id, issuer]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Task AI message not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

// Create a task AI message
export const createTaskAiMessage = async (req, res, next) => {
  try {
    const { issuer } = req.user;
    const { task_id, message, from_user, from_ai } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO task_ai_messages (task_id, user_id, message, from_user, from_ai)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [task_id, issuer, message, from_user || false, from_ai || false]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
};

// Update a task AI message
export const updateTaskAiMessage = async (req, res, next) => {
  try {
    const { message, from_user, from_ai } = req.body;
    const { issuer } = req.user;
    const { id } = req.params;
    const { rows } = await pool.query(
      `UPDATE task_ai_messages
       SET message = COALESCE($1, message),
           from_user = COALESCE($2, from_user),
           from_ai = COALESCE($3, from_ai)
       WHERE id = $4 AND user_id = $5
       RETURNING *`,
      [message, from_user, from_ai, id, issuer]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Task AI message not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

// Delete a task AI message (hard delete, as schema has no deleted_at)
export const deleteTaskAiMessage = async (req, res, next) => {
  try {
    const { issuer } = req.user;
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM task_ai_messages WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, issuer]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Task AI message not found' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};