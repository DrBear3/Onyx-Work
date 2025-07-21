import pool from '../db/pool.js';

// List subtasks for the user, optionally filtered by task_id
export const getSubtasks = async (req, res, next) => {
  try {
    const { issuer } = req.user;
    const { task_id } = req.query;
    let rows;
    if (task_id) {
      const result = await pool.query(
        'SELECT * FROM subtasks WHERE task_id = $1 AND user_id = $2 AND deleted_at IS NULL ORDER BY created_at DESC',
        [task_id, issuer]
      );
      rows = result.rows;
    } else {
      const result = await pool.query(
        'SELECT * FROM subtasks WHERE user_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC',
        [issuer]
      );
      rows = result.rows;
    }
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

// Get a single subtask by id
export const getSubtaskById = async (req, res, next) => {
  try {
    const { issuer } = req.user;
    const { id } = req.params;
    const { rows } = await pool.query(
      'SELECT * FROM subtasks WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL',
      [id, issuer]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Subtask not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

// Create a subtask
export const createSubtask = async (req, res, next) => {
  try {
    const { issuer } = req.user;
    const { task_id, title, completed_at } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO subtasks (task_id, user_id, title, completed_at)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [task_id, issuer, title, completed_at || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
};

// Update a subtask
export const updateSubtask = async (req, res, next) => {
  try {
    const { title, completed_at } = req.body;
    const { issuer } = req.user;
    const { id } = req.params;
    const { rows } = await pool.query(
      `UPDATE subtasks
       SET title = COALESCE($1, title),
           completed_at = COALESCE($2, completed_at),
           updated_at = NOW()
       WHERE id = $3 AND user_id = $4 AND deleted_at IS NULL
       RETURNING *`,
      [title, completed_at, id, issuer]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Subtask not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

// Soft-delete a subtask
export const deleteSubtask = async (req, res, next) => {
  try {
    const { issuer } = req.user;
    const { id } = req.params;
    const result = await pool.query(
      'UPDATE subtasks SET deleted_at = NOW() WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL RETURNING id',
      [id, issuer]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Subtask not found' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};