// controllers/assistantMessagesController.js
import pool from '../db/pool.js';

// List assistant messages for the user
export const getAssistantMessages = async (req, res, next) => {
  try {
    const { issuer } = req.user;
    const { rows } = await pool.query(
      'SELECT * FROM assistant_messages WHERE user_id = $1 ORDER BY created_at DESC',
      [issuer]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

// Get a single assistant message by id
export const getAssistantMessageById = async (req, res, next) => {
  try {
    const { issuer } = req.user;
    const { id } = req.params;
    const { rows } = await pool.query(
      'SELECT * FROM assistant_messages WHERE id = $1 AND user_id = $2',
      [id, issuer]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Assistant message not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

// Create an assistant message
export const createAssistantMessage = async (req, res, next) => {
  try {
    const { issuer } = req.user;
    const { message, from_user, from_ai } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO assistant_messages (user_id, message, from_user, from_ai)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [issuer, message, from_user || false, from_ai || false]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
};

// Update an assistant message
export const updateAssistantMessage = async (req, res, next) => {
  try {
    const { message, from_user, from_ai } = req.body;
    const { issuer } = req.user;
    const { id } = req.params;
    const { rows } = await pool.query(
      `UPDATE assistant_messages
       SET message = COALESCE($1, message),
           from_user = COALESCE($2, from_user),
           from_ai = COALESCE($3, from_ai)
       WHERE id = $4 AND user_id = $5
       RETURNING *`,
      [message, from_user, from_ai, id, issuer]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Assistant message not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

// Delete an assistant message (hard delete, as schema has no deleted_at)
export const deleteAssistantMessage = async (req, res, next) => {
  try {
    const { issuer } = req.user;
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM assistant_messages WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, issuer]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Assistant message not found' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};