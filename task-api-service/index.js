import dotenv from "dotenv";
import express from "express";
import pg from "pg";

dotenv.config();

const { Pool } = pg;

const app = express();
app.use(express.json());

require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

// Configure PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Or: user, password, database, host, port from .env
});

// --- FOLDERS CRUD ---

// Get all folders for a user
app.get('/folders', async (req, res) => {
  const { user_id } = req.query;
  try {
    const { rows } = await pool.query(
      'SELECT * FROM folders WHERE user_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC',
      [user_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a folder
app.post('/folders', async (req, res) => {
  const { user_id, name } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO folders (user_id, name) VALUES ($1, $2) RETURNING *',
      [user_id, name]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Soft-delete a folder
app.delete('/folders/:id', async (req, res) => {
  try {
    await pool.query(
      'UPDATE folders SET deleted_at = NOW() WHERE id = $1',
      [req.params.id]
    );
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- TASKS CRUD ---

// Get all tasks for a folder
app.get('/tasks', async (req, res) => {
  const { folder_id, user_id } = req.query;
  try {
    const { rows } = await pool.query(
      'SELECT * FROM tasks WHERE folder_id = $1 AND user_id = $2 AND deleted_at IS NULL ORDER BY created_at DESC',
      [folder_id, user_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a task
app.post('/tasks', async (req, res) => {
  const { folder_id, user_id, title, description, due_date, is_repeating } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO tasks (folder_id, user_id, title, description, due_date, is_repeating)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [folder_id, user_id, title, description, due_date, is_repeating || false]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a task (e.g., mark completed, edit details)
app.put('/tasks/:id', async (req, res) => {
  const { title, description, due_date, is_repeating, completed_at } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE tasks
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           due_date = COALESCE($3, due_date),
           is_repeating = COALESCE($4, is_repeating),
           completed_at = COALESCE($5, completed_at),
           updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [title, description, due_date, is_repeating, completed_at, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Soft-delete a task
app.delete('/tasks/:id', async (req, res) => {
  try {
    await pool.query(
      'UPDATE tasks SET deleted_at = NOW() WHERE id = $1',
      [req.params.id]
    );
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- SERVER ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`);
});