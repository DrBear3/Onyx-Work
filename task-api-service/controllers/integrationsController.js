import pool from '../db/pool.js';

// List integrations for authenticated user
export const getIntegrations = async (req, res, next) => {
  try {
    const { issuer } = req.user;
    const { rows } = await pool.query(
      'SELECT * FROM integrations WHERE user_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC',
      [issuer]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

// Get a single integration by id
export const getIntegrationById = async (req, res, next) => {
  try {
    const { issuer } = req.user;
    const { id } = req.params;
    const { rows } = await pool.query(
      'SELECT * FROM integrations WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL',
      [id, issuer]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Integration not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

// Create an integration
export const createIntegration = async (req, res, next) => {
  try {
    const { issuer } = req.user;
    const { gmail } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO integrations (user_id, gmail)
       VALUES ($1, $2) RETURNING *`,
      [issuer, gmail]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
};

// Update an integration
export const updateIntegration = async (req, res, next) => {
  try {
    const { gmail } = req.body;
    const { issuer } = req.user;
    const { id } = req.params;
    const { rows } = await pool.query(
      `UPDATE integrations
       SET gmail = COALESCE($1, gmail),
           updated_at = NOW()
       WHERE id = $2 AND user_id = $3 AND deleted_at IS NULL
       RETURNING *`,
      [gmail, id, issuer]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Integration not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

// Soft-delete an integration
export const deleteIntegration = async (req, res, next) => {
  try {
    const { issuer } = req.user;
    const { id } = req.params;
    const result = await pool.query(
      'UPDATE integrations SET deleted_at = NOW() WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL RETURNING id',
      [id, issuer]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Integration not found' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};