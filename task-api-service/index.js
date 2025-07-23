import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';

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
import aiRouter from './routes/ai.js';

import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for API
  crossOriginEmbedderPolicy: false
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token']
}));

// Logging middleware
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Body parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging in development
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Health check with more details
app.get('/', (req, res) => {
  res.json({ 
    status: 'API is running!',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes with versioning
app.use('/api/v1/folders', foldersRouter);
app.use('/api/v1/tasks', tasksRouter);
app.use('/api/v1/subtasks', subtasksRouter);
app.use('/api/v1/notes', notesRouter);
app.use('/api/v1/app_users', app_usersRouter);
app.use('/api/v1/integrations', integrationsRouter);
app.use('/api/v1/task_ai_messages', task_ai_messagesRouter);
app.use('/api/v1/assistant_messages', assistant_messagesRouter);
app.use('/api/v1/suggested_tasks', suggested_tasksRouter); 
app.use('/api/v1/stripe', stripeRouter);
app.use('/api/v1/ai', aiRouter);

// Backward compatibility (keep old routes)
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
app.use('/ai', aiRouter);

// Handle 404 routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    availableRoutes: [
      'GET / - Health check',
      'GET /api/v1/tasks - List tasks',
      'POST /api/v1/tasks - Create task',
      'GET /api/v1/ai/suggestion - Get single AI task suggestion',
      'POST /api/v1/ai/parse-date - Parse natural language dates',
      'POST /api/v1/ai/onboarding-tasks - Create onboarding tasks',
      'POST /api/v1/ai/create-task-smart - Create task with AI date parsing'
    ]
  });
});

// Centralized error handler (last, after all routes)
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`);
});