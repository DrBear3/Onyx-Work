import pool from '../db/pool.js';

// List notes for the user, optionally filtered by task_id
export const getNotes = async (req, res, next) => {
  try {
    const { issuer } = req.user;
    const { task_id } = req.query;
    let rows;
    if (task_id) {
      const result = await pool.query(
        'SELECT * FROM notes WHERE task_id = $1 AND user_id = $2 AND deleted_at IS NULL ORDER BY created_at DESC',
        [task_id, issuer]
      );
      rows = result.rows;
    } else {
      const result = await pool.query(
        'SELECT * FROM notes WHERE user_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC',
        [issuer]
      );
      rows = result.rows;
    }
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

// Get a single note by id
export const getNoteById = async (req, res, next) => {
  try {
    const { issuer } = req.user;
    const { id } = req.params;
    const { rows } = await pool.query(
      'SELECT * FROM notes WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL',
      [id, issuer]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Note not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

// Create a note
export const createNote = async (req, res, next) => {
  try {
    const { issuer } = req.user;
    const { task_id, content } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO notes (task_id, user_id, content)
       VALUES ($1, $2, $3) RETURNING *`,
      [task_id, issuer, content]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
};

// Update a note
export const updateNote = async (req, res, next) => {
  try {
    const { content } = req.body;
    const { issuer } = req.user;
    const { id } = req.params;
    const { rows } = await pool.query(
      `UPDATE notes
       SET content = COALESCE($1, content),
           updated_at = NOW()
       WHERE id = $2 AND user_id = $3 AND deleted_at IS NULL
       RETURNING *`,
      [content, id, issuer]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Note not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

// Soft-delete a note
export const deleteNote = async (req, res, next) => {
  try {
    const { issuer } = req.user;
    const { id } = req.params;
    const result = await pool.query(
      'UPDATE notes SET deleted_at = NOW() WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL RETURNING id',
      [id, issuer]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Note not found' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};