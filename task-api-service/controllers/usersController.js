import pool from '../db/pool.js';

// Get current user info (profile) by Magic issuer
export const getCurrentUser = async (req, res, next) => {
  try {
    const { issuer } = req.user;
    const { rows } = await pool.query(
      'SELECT * FROM app_users WHERE user_id = $1 AND deleted_at IS NULL',
      [issuer]
    );
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

// Create user (for signup)
export const createUser = async (req, res, next) => {
  try {
    const { email, auth_method, subscription } = req.body;
    const { issuer } = req.user;
    const { rows } = await pool.query(
      'INSERT INTO app_users (user_id, email, auth_method, subscription) VALUES ($1, $2, $3, $4) RETURNING *',
      [issuer, email, auth_method, subscription]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
};

// Update user profile
export const updateUser = async (req, res, next) => {
  try {
    const { email, auth_method, subscription } = req.body;
    const { issuer } = req.user;
    const { rows } = await pool.query(
      `UPDATE app_users
       SET email = COALESCE($1, email),
           auth_method = COALESCE($2, auth_method),
           subscription = COALESCE($3, subscription),
           updated_at = NOW()
       WHERE user_id = $4 AND deleted_at IS NULL
       RETURNING *`,
      [email, auth_method, subscription, issuer]
    );
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

// Soft-delete user
export const deleteUser = async (req, res, next) => {
  try {
    const { issuer } = req.user;
    // Soft delete the user by setting deleted_at
    const { rowCount } = await pool.query(
      'UPDATE app_users SET deleted_at = NOW() WHERE user_id = $1 AND deleted_at IS NULL',
      [issuer]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'User not found' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};