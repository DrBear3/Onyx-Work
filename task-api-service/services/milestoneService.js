import pool from '../db/pool.js';
import { AppError } from '../middleware/errorHandler.js';
import subscriptionService from './subscriptionService.js';

/**
 * Milestone Service for tracking user achievements and upgrade opportunities
 */
class MilestoneService {
  
  /**
   * Check if user has reached the 100 tasks milestone and show upgrade suggestion
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Milestone notification or null
   */
  async checkTaskCompletionMilestone(userId) {
    try {
      // Get user's subscription tier
      const subscription = await subscriptionService.getUserSubscription(userId);
      
      // Count user's completed tasks
      const { rows } = await pool.query(
        'SELECT COUNT(*) as completed_count FROM tasks WHERE user_id = $1 AND completed_at IS NOT NULL AND deleted_at IS NULL',
        [userId]
      );
      
      const completedTasks = parseInt(rows[0].completed_count);
      
      // Check if user has reached 100 completed tasks
      if (completedTasks >= 100) {
        // Check if we've already shown this milestone
        const hasSeenMilestone = await this.hasSeenMilestone(userId, 'tasks_100_completed');
        
        if (!hasSeenMilestone) {
          // Mark milestone as seen
          await this.markMilestoneAsSeen(userId, 'tasks_100_completed');
          
          // Return appropriate upgrade message based on current tier
          return this.getUpgradeMessage(subscription.tier, completedTasks);
        }
      }
      
      return null;
      
    } catch (error) {
      console.error('Error checking task completion milestone:', error);
      return null; // Don't throw error for milestone checks
    }
  }

  /**
   * Check if user has seen a specific milestone
   * @param {string} userId - User ID
   * @param {string} milestoneType - Type of milestone
   * @returns {Promise<boolean>} Whether milestone has been seen
   */
  async hasSeenMilestone(userId, milestoneType) {
    try {
      const { rows } = await pool.query(
        'SELECT id FROM user_milestones WHERE user_id = $1 AND milestone_type = $2',
        [userId, milestoneType]
      );
      
      return rows.length > 0;
      
    } catch (error) {
      // If table doesn't exist, create it
      if (error.code === '42P01') {
        await this.createMilestonesTable();
        return false;
      }
      console.error('Error checking milestone:', error);
      return false;
    }
  }

  /**
   * Mark milestone as seen for user
   * @param {string} userId - User ID
   * @param {string} milestoneType - Type of milestone
   * @returns {Promise<void>}
   */
  async markMilestoneAsSeen(userId, milestoneType) {
    try {
      await pool.query(
        `INSERT INTO user_milestones (user_id, milestone_type, achieved_at, created_at, updated_at)
         VALUES ($1, $2, NOW(), NOW(), NOW())
         ON CONFLICT (user_id, milestone_type) DO NOTHING`,
        [userId, milestoneType]
      );
      
    } catch (error) {
      // If table doesn't exist, create it and try again
      if (error.code === '42P01') {
        await this.createMilestonesTable();
        await this.markMilestoneAsSeen(userId, milestoneType);
      } else {
        console.error('Error marking milestone as seen:', error);
      }
    }
  }

  /**
   * Get appropriate upgrade message based on subscription tier
   * @param {string} tier - Current subscription tier
   * @param {number} completedTasks - Number of completed tasks
   * @returns {Object} Milestone notification object
   */
  getUpgradeMessage(tier, completedTasks) {
    const baseMessage = {
      type: 'milestone_achievement',
      milestone: 'tasks_100_completed',
      completed_tasks: completedTasks,
      achieved_at: new Date().toISOString()
    };

    switch (tier) {
      case 'free':
        return {
          ...baseMessage,
          title: '🎉 Amazing! You\'ve completed 100 tasks!',
          message: 'You\'ve built quite a productivity history! With 100+ completed tasks, you now have enough data in our system to benefit from our Premium features including unlimited AI assistance and advanced task insights.',
          current_tier: 'free',
          suggested_tier: 'premium',
          benefits: [
            'Unlimited AI task assistance',
            'Advanced productivity insights from your 100+ tasks',
            'Smart task suggestions based on your patterns',
            'Priority support'
          ],
          cta_text: 'Upgrade to Premium',
          cta_action: 'upgrade_to_premium'
        };
        
      case 'premium':
        return {
          ...baseMessage,
          title: '🚀 100 Tasks Complete - You\'re a Productivity Pro!',
          message: 'With 100+ completed tasks, you\'ve demonstrated serious commitment to productivity! Your task history is now rich enough to benefit from our Plaid tier\'s AI fine-tuned models and advanced analytics.',
          current_tier: 'premium',
          suggested_tier: 'plaid',
          benefits: [
            'AI fine-tuned specifically for your productivity patterns',
            'Advanced analytics on your 100+ task history',
            'Gmail integration for seamless task management',
            'Expert-level productivity recommendations',
            'Custom productivity insights'
          ],
          cta_text: 'Upgrade to Plaid',
          cta_action: 'upgrade_to_plaid'
        };
        
      case 'plaid':
        return {
          ...baseMessage,
          title: '🏆 Productivity Master - 100 Tasks Complete!',
          message: 'Congratulations on completing 100 tasks! You\'re making the most of our Plaid features. Your productivity journey is impressive!',
          current_tier: 'plaid',
          suggested_tier: null,
          benefits: [
            'You\'re already using our most advanced features',
            'Your fine-tuned AI is learning from your 100+ tasks',
            'Continue leveraging Gmail integration',
            'Keep building your productivity empire!'
          ],
          cta_text: 'Keep Going!',
          cta_action: 'continue_productivity'
        };
        
      default:
        return {
          ...baseMessage,
          title: '🎉 100 Tasks Complete!',
          message: 'Congratulations on this productivity milestone!',
          current_tier: tier,
          suggested_tier: 'premium',
          benefits: ['Consider upgrading for more features'],
          cta_text: 'Learn More',
          cta_action: 'learn_more'
        };
    }
  }

  /**
   * Create user_milestones table if it doesn't exist
   * @returns {Promise<void>}
   */
  async createMilestonesTable() {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS user_milestones (
          id SERIAL PRIMARY KEY,
          user_id TEXT NOT NULL,
          milestone_type VARCHAR(50) NOT NULL,
          achieved_at TIMESTAMP DEFAULT NOW(),
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(user_id, milestone_type)
        );
        
        CREATE INDEX IF NOT EXISTS idx_user_milestones_user_id 
        ON user_milestones (user_id);
        
        CREATE INDEX IF NOT EXISTS idx_user_milestones_type 
        ON user_milestones (milestone_type);
      `);
      
      console.log('User milestones table created successfully');
      
    } catch (error) {
      console.error('Error creating milestones table:', error);
      throw error;
    }
  }

  /**
   * Get all milestones for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} User's milestones
   */
  async getUserMilestones(userId) {
    try {
      const { rows } = await pool.query(
        'SELECT * FROM user_milestones WHERE user_id = $1 ORDER BY achieved_at DESC',
        [userId]
      );
      
      return rows;
      
    } catch (error) {
      console.error('Error getting user milestones:', error);
      return [];
    }
  }

  /**
   * Check for any other milestones (extensible for future milestones)
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of milestone notifications
   */
  async checkAllMilestones(userId) {
    try {
      const milestones = [];
      
      // Check 100 tasks milestone
      const taskMilestone = await this.checkTaskCompletionMilestone(userId);
      if (taskMilestone) {
        milestones.push(taskMilestone);
      }
      
      // Future milestones can be added here:
      // - 500 tasks completed
      // - 30 days streak
      // - First note added
      // - First AI interaction
      // etc.
      
      return milestones;
      
    } catch (error) {
      console.error('Error checking all milestones:', error);
      return [];
    }
  }

  /**
   * Check milestones when a task is completed
   * @param {string} userId - User ID
   * @param {number} taskId - Completed task ID
   * @returns {Promise<Array>} Array of milestone notifications
   */
  async onTaskCompleted(userId, taskId) {
    try {
      // This method will be called when a task is marked as completed
      return await this.checkAllMilestones(userId);
      
    } catch (error) {
      console.error('Error processing task completion milestones:', error);
      return [];
    }
  }
}

export default new MilestoneService();
