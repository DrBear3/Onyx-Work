// controllers/integrationsController.js
import pool from '../db/pool.js';

// List integrations for authenticated user
export const getIntegrations = async (req, res, next) => {
  try {
    const { issuer } = req.user;
    const { rows } = await pool.query(
      'SELECT * FROM integrations WHERE user_id = $1 ORDER BY created_at DESC',
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
      'SELECT * FROM integrations WHERE id = $1 AND user_id = $2',
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
    const { gmail, status } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO integrations (user_id, gmail, status)
       VALUES ($1, $2, $3) RETURNING *`,
      [issuer, gmail || false, status || true]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
};

// Update an integration (toggle status or update gmail)
export const updateIntegration = async (req, res, next) => {
  try {
    const { gmail, status } = req.body;
    const { issuer } = req.user;
    const { id } = req.params;
    const { rows } = await pool.query(
      `UPDATE integrations
       SET gmail = COALESCE($1, gmail),
           status = COALESCE($2, status),
           updated_at = NOW()
       WHERE id = $3 AND user_id = $4
       RETURNING *`,
      [gmail, status, id, issuer]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Integration not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};