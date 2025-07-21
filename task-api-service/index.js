import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler.js';
import auth from './middleware/auth.js';

import foldersRouter from './routes/folders.js';
import tasksRouter from './routes/tasks.js';
import subtasksRouter from './routes/subtasks.js';
import notesRouter from './routes/notes.js';
import usersRouter from './routes/users.js';
import integrationsRouter from './routes/integrations.js';
// ...import other routers

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Authentication middleware (applied globally or per route as needed)
// app.use(auth); // (Optional, see below for per-route usage)

// Mount routers
app.use('/folders', auth, foldersRouter);
app.use('/tasks', auth, tasksRouter);
app.use('/subtasks', auth, subtasksRouter);
app.use('/notes', auth, notesRouter);
app.use('/app_users', usersRouter); // e.g. register/login might be public
app.use('/integrations', auth, integrationsRouter);
// ...mount other routers

// Error handling middleware (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`);
});