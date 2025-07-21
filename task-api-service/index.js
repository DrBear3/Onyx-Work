import dotenv from 'dotenv';
import express from 'express';
import pkg from 'pg';

dotenv.config();

const { Pool } = pkg;

const app = express();
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// --- FOLDERS CRUD ---

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

app.put('/folders/:id', async (req, res) => {
  const { name } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE folders SET name = COALESCE($1, name)
       WHERE id = $2 AND deleted_at IS NULL RETURNING *`,
       [name, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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

app.put('/tasks/:id', async (req, res) => {
  const { title, description, due_date, is_repeating, completed_at, last_ai_message_id } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE tasks
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           due_date = COALESCE($3, due_date),
           is_repeating = COALESCE($4, is_repeating),
           completed_at = COALESCE($5, completed_at),
           last_ai_message_id = COALESCE($6, last_ai_message_id),
           updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [title, description, due_date, is_repeating, completed_at, last_ai_message_id, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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

// --- SUBTASKS CRUD ---

app.get('/subtasks', async (req, res) => {
  const { task_id } = req.query;
  try {
    const { rows } = await pool.query(
      'SELECT * FROM subtasks WHERE task_id = $1',
      [task_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/subtasks', async (req, res) => {
  const { task_id, title } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO subtasks (task_id, title) VALUES ($1, $2) RETURNING *',
      [task_id, title]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/subtasks/:id', async (req, res) => {
  const { title } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE subtasks SET title = COALESCE($1, title)
       WHERE id = $2 RETURNING *`,
       [title, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/subtasks/:id', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM subtasks WHERE id = $1',
      [req.params.id]
    );
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- TASK AI MESSAGES ---

app.get('/task_ai_messages', async (req, res) => {
  const { task_id } = req.query;
  try {
    const { rows } = await pool.query(
      'SELECT * FROM task_ai_messages WHERE task_id = $1 ORDER BY created_at ASC',
      [task_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/task_ai_messages', async (req, res) => {
  const { task_id, user_id, message, from_user, from_ai } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO task_ai_messages 
        (task_id, user_id, message, from_user, from_ai)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
       [task_id, user_id, message, from_user, from_ai]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/task_ai_messages/:id', async (req, res) => {
  const { message, from_user, from_ai } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE task_ai_messages
       SET message = COALESCE($1, message),
           from_user = COALESCE($2, from_user),
           from_ai = COALESCE($3, from_ai)
       WHERE id = $4
       RETURNING *`,
      [message, from_user, from_ai, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/task_ai_messages/:id', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM task_ai_messages WHERE id = $1',
      [req.params.id]
    );
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ASSISTANT MESSAGES ---

app.get('/assistant_messages', async (req, res) => {
  const { user_id } = req.query;
  try {
    const { rows } = await pool.query(
      'SELECT * FROM assistant_messages WHERE user_id = $1 ORDER BY created_at ASC',
      [user_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/assistant_messages', async (req, res) => {
  const { user_id, message, from_user, from_ai } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO assistant_messages (user_id, message, from_user, from_ai)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
       [user_id, message, from_user, from_ai]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/assistant_messages/:id', async (req, res) => {
  const { message, from_user, from_ai } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE assistant_messages
       SET message = COALESCE($1, message),
           from_user = COALESCE($2, from_user),
           from_ai = COALESCE($3, from_ai)
       WHERE id = $4
       RETURNING *`,
      [message, from_user, from_ai, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/assistant_messages/:id', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM assistant_messages WHERE id = $1',
      [req.params.id]
    );
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- INTEGRATIONS ---

app.get('/integrations', async (req, res) => {
  const { user_id } = req.query;
  try {
    const { rows } = await pool.query(
      'SELECT * FROM integrations WHERE user_id = $1',
      [user_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/integrations', async (req, res) => {
  const { user_id, gmail } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO integrations (user_id, gmail) VALUES ($1, $2) RETURNING *',
      [user_id, gmail]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/integrations/:id', async (req, res) => {
  const { gmail } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE integrations SET gmail = COALESCE($1, gmail), updated_at = NOW()
       WHERE id = $2 RETURNING *`,
       [gmail, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/integrations/:id', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM integrations WHERE id = $1',
      [req.params.id]
    );
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- APP USERS ---

app.get('/app_users', async (req, res) => {
  const { user_id } = req.query;
  try {
    const { rows } = await pool.query(
      'SELECT * FROM app_users WHERE user_id = $1',
      [user_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/app_users', async (req, res) => {
  const { user_id, email, auth_method, subscription } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO app_users (user_id, email, auth_method, subscription)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [user_id, email, auth_method, subscription]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/app_users/:id', async (req, res) => {
  const { email, auth_method, subscription } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE app_users
       SET email = COALESCE($1, email),
           auth_method = COALESCE($2, auth_method),
           subscription = COALESCE($3, subscription),
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [email, auth_method, subscription, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/app_users/:id', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM app_users WHERE id = $1',
      [req.params.id]
    );
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- SUGGESTED TASKS ---

app.get('/suggested_tasks', async (req, res) => {
  const { user_id, suggestion_batch_id } = req.query;
  try {
    let query, params;
    if (suggestion_batch_id) {
      query = 'SELECT * FROM suggested_tasks WHERE user_id = $1 AND suggestion_batch_id = $2';
      params = [user_id, suggestion_batch_id];
    } else {
      query = 'SELECT * FROM suggested_tasks WHERE user_id = $1';
      params = [user_id];
    }
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/suggested_tasks', async (req, res) => {
  const { user_id, suggestion_batch_id, title, is_completed } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO suggested_tasks (user_id, suggestion_batch_id, title, is_completed)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [user_id, suggestion_batch_id, title, is_completed || false]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/suggested_tasks/:id', async (req, res) => {
  const { title, is_completed } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE suggested_tasks
       SET title = COALESCE($1, title),
           is_completed = COALESCE($2, is_completed)
       WHERE id = $3
       RETURNING *`,
      [title, is_completed, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/suggested_tasks/:id', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM suggested_tasks WHERE id = $1',
      [req.params.id]
    );
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- NOTES ---

app.get('/notes', async (req, res) => {
  const { task_id } = req.query;
  try {
    const { rows } = await pool.query(
      'SELECT * FROM notes WHERE task_id = $1 ORDER BY created_at ASC',
      [task_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/notes', async (req, res) => {
  const { task_id, user_id, content } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO notes (task_id, user_id, content) VALUES ($1, $2, $3) RETURNING *',
      [task_id, user_id, content]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/notes/:id', async (req, res) => {
  const { content } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE notes SET content = COALESCE($1, content), updated_at = NOW()
       WHERE id = $2 RETURNING *`,
       [content, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/notes/:id', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM notes WHERE id = $1',
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
