import pool from '../db/pool.js';

// List subtasks for the user, optionally filtered by task_id
export const getSubtasks = async (req, res, next) => {
  try {
    const { issuer } = req.user;
    const { task_id } = req.query;
    let rows;
    if (task_id) {
      if (!validateUUID(task_id)) {
        return res.status(400).json({ error: 'Invalid UUID format for task_id' });
      }
      const result = await pool.query(
        'SELECT s.* FROM subtasks s JOIN tasks t ON s.task_id = t.id WHERE s.task_id = $1 AND t.user_id = $2 AND s.deleted_at IS NULL ORDER BY s.title ASC',
        [task_id, issuer]
      );
      rows = result.rows;
    } else {
      const result = await pool.query(
        'SELECT s.* FROM subtasks s JOIN tasks t ON s.task_id = t.id WHERE t.user_id = $1 AND s.deleted_at IS NULL ORDER BY s.title ASC',
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
    if (!validateUUID(id)) {
      return res.status(400).json({ error: 'Invalid UUID format for id' });
    }
    const { rows } = await pool.query(
      'SELECT s.* FROM subtasks s JOIN tasks t ON s.task_id = t.id WHERE s.id = $1 AND t.user_id = $2 AND s.deleted_at IS NULL',
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
    if (!task_id || !title) {
      return res.status(400).json({ error: 'task_id and title are required' });
    }
    if (!validateUUID(task_id)) {
      return res.status(400).json({ error: 'Invalid UUID format for task_id' });
    }
    // Verify task_id belongs to the user
    const { rows: taskRows } = await pool.query(
      'SELECT id FROM tasks WHERE id = $1 AND user_id = $2',
      [task_id, issuer]
    );
    if (!taskRows[0]) {
      return res.status(400).json({ error: 'task_id does not exist or is not accessible' });
    }
    const { rows } = await pool.query(
      `INSERT INTO subtasks (task_id, title, completed_at)
       VALUES ($1, $2, $3) RETURNING *`,
      [task_id, title, completed_at || null]
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
    if (!validateUUID(id)) {
      return res.status(400).json({ error: 'Invalid UUID format for id' });
    }
    const { rows } = await pool.query(
      `UPDATE subtasks s
       SET title = COALESCE($1, title),
           completed_at = COALESCE($2, completed_at)
       FROM tasks t
       WHERE s.task_id = t.id AND s.id = $3 AND t.user_id = $4 AND s.deleted_at IS NULL
       RETURNING s.*`,
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
    if (!validateUUID(id)) {
      return res.status(400).json({ error: 'Invalid UUID format for id' });
    }
    const result = await pool.query(
      `UPDATE subtasks s
       SET deleted_at = NOW()
       FROM tasks t
       WHERE s.task_id = t.id AND s.id = $1 AND t.user_id = $2 AND s.deleted_at IS NULL
       RETURNING s.id`,
      [id, issuer]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Subtask not found' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};