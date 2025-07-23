import pool from '../db/pool.js';
import openaiService from '../services/openaiService.js';
import { AppError } from '../middleware/errorHandler.js';

// Get all users (admin/dev purpose)
export const getAllUsers = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM app_users WHERE deleted_at IS NULL ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

// Get current user info (profile) by Magic issuer
export const getCurrentUser = async (req, res, next) => {
  try {
    // Temporarily use a mock issuer or from query param for testing
    const issuer = req.user?.issuer || req.query.user_id || 'test-issuer-uuid';
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

// Get user by id (admin/dev purpose)
export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      'SELECT * FROM app_users WHERE id = $1 AND deleted_at IS NULL',
      [id]
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
    const { user_id, email, auth_method, subscription } = req.body;
    // Temporarily use user_id from body for testing (postponing Magic issuer)
    // If not provided, fallback to mock
    const effectiveUserId = user_id || req.user?.issuer || 'test-issuer-uuid';
    
    // Create the user
    const { rows } = await pool.query(
      'INSERT INTO app_users (user_id, email, auth_method, subscription) VALUES ($1, $2, $3, $4) RETURNING *',
      [effectiveUserId, email, auth_method, subscription]
    );
    
    const newUser = rows[0];
    
    // Create onboarding tasks for the new user
    try {
      const onboardingTasks = openaiService.getOnboardingTasks();
      const createdTasks = [];

      for (const taskData of onboardingTasks) {
        const taskResult = await pool.query(
          `INSERT INTO tasks (user_id, title, description, is_repeating, created_at, updated_at)
           VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING *`,
          [effectiveUserId, taskData.title, taskData.description, false]
        );
        createdTasks.push(taskResult.rows[0]);
      }

      // Return user with onboarding tasks
      res.status(201).json({
        success: true,
        data: {
          user: newUser,
          onboarding_tasks: createdTasks
        },
        message: `User created successfully with ${createdTasks.length} onboarding tasks`
      });
      
    } catch (onboardingError) {
      console.error('Failed to create onboarding tasks:', onboardingError);
      // User was created successfully, but onboarding tasks failed
      // Still return success but note the issue
      res.status(201).json({
        success: true,
        data: {
          user: newUser,
          onboarding_tasks: []
        },
        message: 'User created successfully (onboarding tasks could not be created)',
        warning: 'Onboarding tasks creation failed'
      });
    }
    
  } catch (err) {
    next(err);
  }
};

// Update user profile
export const updateUser = async (req, res, next) => {
  try {
    const { email, auth_method, subscription } = req.body;
    // Temporarily use issuer from req.user or body for testing
    const issuer = req.user?.issuer || req.body.user_id || 'test-issuer-uuid';
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
    // Temporarily use issuer from req.user or query for testing
    const issuer = req.user?.issuer || req.query.user_id || 'test-issuer-uuid';
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