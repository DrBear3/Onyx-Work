// controllers/suggested_tasksController.js
import pool from '../db/pool.js';

// List suggested tasks for the user, optionally filtered by suggestion_batch_id
export const getSuggestedTasks = async (req, res, next) => {
  try {
    const { issuer } = req.user;
    const { suggestion_batch_id } = req.query;
    let rows;
    if (suggestion_batch_id) {
      const result = await pool.query(
        'SELECT * FROM suggested_tasks WHERE suggestion_batch_id = $1 AND user_id = $2 ORDER BY suggested_at DESC',
        [suggestion_batch_id, issuer]
      );
      rows = result.rows;
    } else {
      const result = await pool.query(
        'SELECT * FROM suggested_tasks WHERE user_id = $1 ORDER BY suggested_at DESC',
        [issuer]
      );
      rows = result.rows;
    }
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

// Get a single suggested task by id
export const getSuggestedTaskById = async (req, res, next) => {
  try {
    const { issuer } = req.user;
    const { id } = req.params;
    const { rows } = await pool.query(
      'SELECT * FROM suggested_tasks WHERE id = $1 AND user_id = $2',
      [id, issuer]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Suggested task not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

// Create a suggested task
export const createSuggestedTask = async (req, res, next) => {
  try {
    const { issuer } = req.user;
    const { suggestion_batch_id, title, is_added } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO suggested_tasks (user_id, suggestion_batch_id, title, is_added)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [issuer, suggestion_batch_id, title, is_added || false]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
};

// Update a suggested task
export const updateSuggestedTask = async (req, res, next) => {
  try {
    const { title, is_added } = req.body;
    const { issuer } = req.user;
    const { id } = req.params;
    const { rows } = await pool.query(
      `UPDATE suggested_tasks
       SET title = COALESCE($1, title),
           is_added = COALESCE($2, is_added),
           declined_at = CASE WHEN $2 = false THEN NOW() ELSE NULL END
       WHERE id = $3 AND user_id = $4
       RETURNING *`,
      [title, is_added, id, issuer]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Suggested task not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

// Delete a suggested task (hard delete, as schema has no deleted_at)
export const deleteSuggestedTask = async (req, res, next) => {
  try {
    const { issuer } = req.user;
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM suggested_tasks WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, issuer]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Suggested task not found' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};