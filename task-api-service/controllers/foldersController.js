import pool from '../db/pool.js';

// List folders for authenticated user
export const getFolders = async (req, res, next) => {
  try {
    const { issuer } = req.user;
    const { rows } = await pool.query(
      'SELECT * FROM folders WHERE user_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC',
      [issuer]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

// Get a folder by id
export const getFolderById = async (req, res, next) => {
  try {
    const { issuer } = req.user;
    const { id } = req.params;
    const { rows } = await pool.query(
      'SELECT * FROM folders WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL',
      [id, issuer]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Folder not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

// Create a folder
export const createFolder = async (req, res, next) => {
  try {
    const { issuer } = req.user;
    const { name } = req.body;
    const { rows } = await pool.query(
      'INSERT INTO folders (user_id, name) VALUES ($1, $2) RETURNING *',
      [issuer, name]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
};

// Update a folder
export const updateFolder = async (req, res, next) => {
  try {
    const { name } = req.body;
    const { issuer } = req.user;
    const { id } = req.params;
    const { rows } = await pool.query(
      `UPDATE folders SET name = COALESCE($1, name)
       WHERE id = $2 AND user_id = $3 AND deleted_at IS NULL RETURNING *`,
      [name, id, issuer]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Folder not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

// Soft-delete a folder
export const deleteFolder = async (req, res, next) => {
  try {
    const { issuer } = req.user;
    const { id } = req.params;
    const result = await pool.query(
      'UPDATE folders SET deleted_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, issuer]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Folder not found' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};