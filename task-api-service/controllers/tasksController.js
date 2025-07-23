import pool from '../db/pool.js';
import { AppError } from '../middleware/errorHandler.js';

// List tasks for the user, optionally filtered by folder_id
export const getTasks = async (req, res, next) => {
  try {
    const { issuer } = req.user;
    const { 
      folder_id, 
      status, 
      page = 1, 
      limit = 10, 
      sort_by = 'created_at', 
      sort_order = 'DESC' 
    } = req.query;
    
    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;
    
    // Validate sort parameters
    const allowedSortFields = ['created_at', 'updated_at', 'title', 'due_date'];
    const allowedSortOrders = ['ASC', 'DESC'];
    const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'created_at';
    const sortOrder = allowedSortOrders.includes(sort_order.toUpperCase()) ? sort_order.toUpperCase() : 'DESC';
    
    let baseQuery = 'SELECT * FROM tasks WHERE user_id = $1 AND deleted_at IS NULL';
    let countQuery = 'SELECT COUNT(*) FROM tasks WHERE user_id = $1 AND deleted_at IS NULL';
    let queryParams = [issuer];
    let paramIndex = 2;
    
    // Add filters
    if (folder_id) {
      baseQuery += ` AND folder_id = $${paramIndex}`;
      countQuery += ` AND folder_id = $${paramIndex}`;
      queryParams.push(folder_id);
      paramIndex++;
    }
    
    if (status) {
      const statusCondition = status === 'completed' ? 'completed_at IS NOT NULL' : 'completed_at IS NULL';
      baseQuery += ` AND ${statusCondition}`;
      countQuery += ` AND ${statusCondition}`;
    }
    
    // Add sorting and pagination
    baseQuery += ` ORDER BY ${sortField} ${sortOrder} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limitNum, offset);
    
    // Execute queries
    const [tasksResult, countResult] = await Promise.all([
      pool.query(baseQuery, queryParams),
      pool.query(countQuery, queryParams.slice(0, paramIndex - 1))
    ]);
    
    const total = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(total / limitNum);
    
    res.json({
      success: true,
      data: tasksResult.rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    });
  } catch (err) {
    next(err);
  }
};

// Get a single task by id
export const getTaskById = async (req, res, next) => {
  try {
    const { issuer } = req.user;
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      throw new AppError('Invalid task ID', 400);
    }
    
    const { rows } = await pool.query(
      'SELECT * FROM tasks WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL',
      [id, issuer]
    );
    
    if (!rows[0]) {
      throw new AppError('Task not found', 404);
    }
    
    res.json({
      success: true,
      data: rows[0]
    });
  } catch (err) {
    next(err);
  }
};

// Create a task
export const createTask = async (req, res, next) => {
  try {
    const { issuer } = req.user;
    const { folder_id, title, description, due_date, is_repeating } = req.body;
    
    // Additional validation
    if (!title || title.trim().length === 0) {
      throw new AppError('Title is required and cannot be empty', 400);
    }
    
    if (title.length > 200) {
      throw new AppError('Title cannot exceed 200 characters', 400);
    }
    
    if (description && description.length > 1000) {
      throw new AppError('Description cannot exceed 1000 characters', 400);
    }
    
    if (due_date && new Date(due_date) < new Date()) {
      throw new AppError('Due date cannot be in the past', 400);
    }
    
    const { rows } = await pool.query(
      `INSERT INTO tasks (folder_id, user_id, title, description, due_date, is_repeating)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [folder_id, issuer, title.trim(), description?.trim() || null, due_date || null, is_repeating || false]
    );
    
    res.status(201).json({
      success: true,
      data: rows[0],
      message: 'Task created successfully'
    });
  } catch (err) {
    next(err);
  }
};

// Update a task
export const updateTask = async (req, res, next) => {
  try {
    const { title, description, due_date, is_repeating, completed_at, last_ai_message_id } = req.body;
    const { issuer } = req.user;
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      throw new AppError('Invalid task ID', 400);
    }
    
    // Validation for updates
    if (title !== undefined) {
      if (!title || title.trim().length === 0) {
        throw new AppError('Title cannot be empty', 400);
      }
      if (title.length > 200) {
        throw new AppError('Title cannot exceed 200 characters', 400);
      }
    }
    
    if (description !== undefined && description && description.length > 1000) {
      throw new AppError('Description cannot exceed 1000 characters', 400);
    }
    
    if (due_date !== undefined && due_date && new Date(due_date) < new Date()) {
      throw new AppError('Due date cannot be in the past', 400);
    }
    
    const { rows } = await pool.query(
      `UPDATE tasks
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           due_date = COALESCE($3, due_date),
           is_repeating = COALESCE($4, is_repeating),
           completed_at = COALESCE($5, completed_at),
           last_ai_message_id = COALESCE($6, last_ai_message_id),
           updated_at = NOW()
       WHERE id = $7 AND user_id = $8 AND deleted_at IS NULL
       RETURNING *`,
      [
        title?.trim(), 
        description?.trim(), 
        due_date, 
        is_repeating, 
        completed_at, 
        last_ai_message_id, 
        id, 
        issuer
      ]
    );
    
    if (!rows[0]) {
      throw new AppError('Task not found', 404);
    }
    
    res.json({
      success: true,
      data: rows[0],
      message: 'Task updated successfully'
    });
  } catch (err) {
    next(err);
  }
};

// Soft-delete a task
export const deleteTask = async (req, res, next) => {
  try {
    const { issuer } = req.user;
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      throw new AppError('Invalid task ID', 400);
    }
    
    const result = await pool.query(
      'UPDATE tasks SET deleted_at = NOW() WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL RETURNING id',
      [id, issuer]
    );
    
    if (!result.rows[0]) {
      throw new AppError('Task not found', 404);
    }
    
    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};

// Toggle task completion status
export const toggleTaskCompletion = async (req, res, next) => {
  try {
    const { issuer } = req.user;
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      throw new AppError('Invalid task ID', 400);
    }
    
    // First get the current task
    const currentTask = await pool.query(
      'SELECT * FROM tasks WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL',
      [id, issuer]
    );
    
    if (!currentTask.rows[0]) {
      throw new AppError('Task not found', 404);
    }
    
    const isCompleted = currentTask.rows[0].completed_at !== null;
    const newCompletedAt = isCompleted ? null : new Date().toISOString();
    
    const { rows } = await pool.query(
      `UPDATE tasks 
       SET completed_at = $1, updated_at = NOW()
       WHERE id = $2 AND user_id = $3 AND deleted_at IS NULL
       RETURNING *`,
      [newCompletedAt, id, issuer]
    );
    
    res.json({
      success: true,
      data: rows[0],
      message: `Task ${isCompleted ? 'marked as incomplete' : 'completed'} successfully`
    });
  } catch (err) {
    next(err);
  }
};