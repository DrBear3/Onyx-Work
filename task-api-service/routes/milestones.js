import express from 'express';
import auth from '../middleware/auth.js';
import milestoneService from '../services/milestoneService.js';
import pool from '../db/pool.js';
import { AppError } from '../middleware/errorHandler.js';

const router = express.Router();

/**
 * Get all milestones for the authenticated user
 * GET /api/v1/milestones
 */
router.get('/', auth, async (req, res, next) => {
  try {
    const { issuer } = req.user;
    
    const milestones = await milestoneService.getUserMilestones(issuer);
    
    res.json({
      success: true,
      data: milestones,
      count: milestones.length
    });
    
  } catch (error) {
    console.error('Error getting user milestones:', error);
    next(new AppError('Failed to get milestones', 500));
  }
});

/**
 * Check for pending milestones for the authenticated user
 * GET /api/v1/milestones/check
 */
router.get('/check', auth, async (req, res, next) => {
  try {
    const { issuer } = req.user;
    
    const pendingMilestones = await milestoneService.checkAllMilestones(issuer);
    
    res.json({
      success: true,
      data: pendingMilestones,
      count: pendingMilestones.length,
      has_pending: pendingMilestones.length > 0
    });
    
  } catch (error) {
    console.error('Error checking pending milestones:', error);
    next(new AppError('Failed to check milestones', 500));
  }
});

/**
 * Mark a milestone as dismissed by the user
 * POST /api/v1/milestones/:milestoneType/dismiss
 */
router.post('/:milestoneType/dismiss', auth, async (req, res, next) => {
  try {
    const { issuer } = req.user;
    const { milestoneType } = req.params;
    
    // Mark milestone as seen (dismissed)
    await milestoneService.markMilestoneAsSeen(issuer, milestoneType);
    
    res.json({
      success: true,
      message: 'Milestone dismissed successfully'
    });
    
  } catch (error) {
    console.error('Error dismissing milestone:', error);
    next(new AppError('Failed to dismiss milestone', 500));
  }
});

/**
 * Get milestone stats for the user (for analytics)
 * GET /api/v1/milestones/stats
 */
router.get('/stats', auth, async (req, res, next) => {
  try {
    const { issuer } = req.user;
    
    // Get task completion count for progress tracking
    const { rows: taskStats } = await pool.query(
      `SELECT 
         COUNT(*) as total_tasks,
         COUNT(CASE WHEN completed_at IS NOT NULL THEN 1 END) as completed_tasks,
         COUNT(CASE WHEN completed_at IS NULL THEN 1 END) as pending_tasks
       FROM tasks 
       WHERE user_id = $1 AND deleted_at IS NULL`,
      [issuer]
    );
    
    const milestones = await milestoneService.getUserMilestones(issuer);
    const milestoneTypes = milestones.map(m => m.milestone_type);
    
    res.json({
      success: true,
      data: {
        task_stats: taskStats[0],
        milestones_achieved: milestones.length,
        milestone_types: milestoneTypes,
        progress_to_100_tasks: Math.min(100, parseInt(taskStats[0].completed_tasks)),
        has_reached_100_tasks: parseInt(taskStats[0].completed_tasks) >= 100
      }
    });
    
  } catch (error) {
    console.error('Error getting milestone stats:', error);
    next(new AppError('Failed to get milestone stats', 500));
  }
});

export default router;
