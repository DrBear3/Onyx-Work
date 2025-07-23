import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';

import foldersRouter from './routes/folders.js';
import tasksRouter from './routes/tasks.js';
import subtasksRouter from './routes/subtasks.js';
import notesRouter from './routes/notes.js';
import app_usersRouter from './routes/app_users.js';
import integrationsRouter from './routes/integrations.js';
import task_ai_messagesRouter from './routes/task_ai_messages.js';
import assistant_messagesRouter from './routes/assistant_messages.js';
import suggested_tasksRouter from './routes/suggested_tasks.js'; 
import stripeRouter from './routes/stripe.js';

import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Mount routers
app.use('/folders', foldersRouter);
app.use('/tasks', tasksRouter);
app.use('/subtasks', subtasksRouter);
app.use('/notes', notesRouter);
app.use('/app_users', app_usersRouter);
app.use('/integrations', integrationsRouter);
app.use('/task_ai_messages', task_ai_messagesRouter);
app.use('/assistant_messages', assistant_messagesRouter);
app.use('/suggested_tasks', suggested_tasksRouter); 
app.use('/stripe', stripeRouter);

// Health check
app.get('/', (req, res) => res.json({ status: 'API is running!' }));

// Centralized error handler (last, after all routes)
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`);
});