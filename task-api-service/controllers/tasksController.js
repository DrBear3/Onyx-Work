import pool from '../db/pool.js';

// List tasks for the user, optionally filtered by folder_id
export const getTasks = async (req, res, next) => {
  try {
    const { issuer } = req.user;
    const { folder_id } = req.query;
    let rows;
    if (folder_id) {
      const result = await pool.query(
        'SELECT * FROM tasks WHERE folder_id = $1 AND user_id = $2 AND deleted_at IS NULL ORDER BY created_at DESC',
        [folder_id, issuer]
      );
      rows = result.rows;
    } else {
      const result = await pool.query(
        'SELECT * FROM tasks WHERE user_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC',
        [issuer]
      );
      rows = result.rows;
    }
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

// Get a single task by id
export const getTaskById = async (req, res, next) => {
  try {
    const { issuer } = req.user;
    const { id } = req.params;
    const { rows } = await pool.query(
      'SELECT * FROM tasks WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL',
      [id, issuer]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Task not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

// Create a task
export const createTask = async (req, res, next) => {
  try {
    const { issuer } = req.user;
    const { folder_id, title, description, due_date, is_repeating } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO tasks (folder_id, user_id, title, description, due_date, is_repeating)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [folder_id, issuer, title, description || null, due_date || null, is_repeating || false]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
};

// Update a task
export const updateTask = async (req, res, next) => {
  try {
    const { title, description, due_date, is_repeating, completed_at, last_ai_message_id } = req.body;
    const { issuer } = req.user;
    const { id } = req.params;
    const { rows } = await pool.query(
      `UPDATE tasks
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           due_date = COALESCE($3, due_date),
           is_repeating = COALESCE($4, is_repeating),
           completed_at = COALESCE($5, completed_at),
           last_ai_message_id = COALESCE($6, last_ai_message_id),
           updated_at = NOW()
       WHERE id = $7 AND user_id = $8 AND deleted_at IS NULL
       RETURNING *`,
      [title, description, due_date, is_repeating, completed_at, last_ai_message_id, id, issuer]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Task not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

// Soft-delete a task
export const deleteTask = async (req, res, next) => {
  try {
    const { issuer } = req.user;
    const { id } = req.params;
    const result = await pool.query(
      'UPDATE tasks SET deleted_at = NOW() WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL RETURNING id',
      [id, issuer]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Task not found' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};