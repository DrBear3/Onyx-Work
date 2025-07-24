import pool from '../db/pool.js';
import subscriptionService from './subscriptionService.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Gmail Integration Service
 * Manages Gmail integration permissions based on subscription tiers
 */
class GmailIntegrationService {

  /**
   * Check if user can enable Gmail integration based on subscription
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Permission status and details
   */
  async checkGmailPermission(userId) {
    try {
      const subscription = await subscriptionService.getUserSubscription(userId);
      
      // Only premium and plaid tiers can use Gmail integration
      const canUseGmail = ['premium', 'plaid'].includes(subscription.tier);
      
      return {
        canUseGmail,
        subscription_tier: subscription.tier,
        reason: canUseGmail 
          ? 'Gmail integration available' 
          : 'Gmail integration requires Premium or Plaid subscription'
      };
    } catch (error) {
      console.error('Error checking Gmail permission:', error);
      throw error;
    }
  }

  /**
   * Get Gmail integration status for a specific task
   * @param {string} userId - User ID
   * @param {string} taskId - Task ID
   * @returns {Promise<Object>} Gmail integration status
   */
  async getGmailIntegrationStatus(userId, taskId) {
    try {
      // Check subscription permission first
      const permission = await this.checkGmailPermission(userId);
      
      if (!permission.canUseGmail) {
        return {
          enabled: false,
          available: false,
          reason: permission.reason,
          subscription_tier: permission.subscription_tier
        };
      }

      // Check if Gmail integration is enabled for this task
      const result = await pool.query(`
        SELECT 
          t.gmail_integration_enabled,
          t.gmail_scope_granted,
          t.gmail_last_sync,
          au.email as user_email
        FROM tasks t
        JOIN app_users au ON t.user_id = au.user_id
        WHERE t.id = $1 AND t.user_id = $2 AND t.deleted_at IS NULL
      `, [taskId, userId]);

      if (!result.rows[0]) {
        throw new AppError('Task not found', 404);
      }

      const task = result.rows[0];
      
      return {
        enabled: task.gmail_integration_enabled || false,
        available: true,
        scope_granted: task.gmail_scope_granted || false,
        last_sync: task.gmail_last_sync,
        user_email: task.user_email,
        subscription_tier: permission.subscription_tier,
        requires_auth: !task.gmail_scope_granted && task.gmail_integration_enabled
      };

    } catch (error) {
      console.error('Error getting Gmail integration status:', error);
      throw error;
    }
  }

  /**
   * Toggle Gmail integration for a task
   * @param {string} userId - User ID
   * @param {string} taskId - Task ID
   * @param {boolean} enabled - Whether to enable or disable
   * @returns {Promise<Object>} Updated status
   */
  async toggleGmailIntegration(userId, taskId, enabled) {
    try {
      // Check subscription permission
      const permission = await this.checkGmailPermission(userId);
      
      if (!permission.canUseGmail && enabled) {
        throw new AppError(permission.reason, 403);
      }

      // Update task Gmail integration status
      const result = await pool.query(`
        UPDATE tasks 
        SET 
          gmail_integration_enabled = $1,
          gmail_scope_granted = CASE 
            WHEN $1 = false THEN false 
            ELSE gmail_scope_granted 
          END,
          updated_at = NOW()
        WHERE id = $2 AND user_id = $3 AND deleted_at IS NULL
        RETURNING 
          gmail_integration_enabled,
          gmail_scope_granted,
          gmail_last_sync
      `, [enabled, taskId, userId]);

      if (!result.rows[0]) {
        throw new AppError('Task not found', 404);
      }

      const updatedTask = result.rows[0];

      return {
        success: true,
        enabled: updatedTask.gmail_integration_enabled,
        scope_granted: updatedTask.gmail_scope_granted,
        last_sync: updatedTask.gmail_last_sync,
        subscription_tier: permission.subscription_tier,
        requires_auth: !updatedTask.gmail_scope_granted && updatedTask.gmail_integration_enabled,
        message: enabled 
          ? 'Gmail integration enabled. You may need to grant permissions.'
          : 'Gmail integration disabled.'
      };

    } catch (error) {
      console.error('Error toggling Gmail integration:', error);
      throw error;
    }
  }

  /**
   * Handle subscription downgrade - disable Gmail for all tasks if user downgrades to free
   * @param {string} userId - User ID
   * @param {string} newTier - New subscription tier
   * @returns {Promise<Object>} Downgrade handling result
   */
  async handleSubscriptionDowngrade(userId, newTier) {
    try {
      // If downgrading to free tier, disable Gmail integration for all tasks
      if (newTier === 'free') {
        const result = await pool.query(`
          UPDATE tasks 
          SET 
            gmail_integration_enabled = false,
            gmail_scope_granted = false,
            gmail_last_sync = NULL,
            updated_at = NOW()
          WHERE user_id = $1 AND gmail_integration_enabled = true AND deleted_at IS NULL
          RETURNING id, title
        `, [userId]);

        const disabledTasks = result.rows;

        return {
          success: true,
          disabled_tasks_count: disabledTasks.length,
          disabled_tasks: disabledTasks,
          message: disabledTasks.length > 0 
            ? `Gmail integration disabled for ${disabledTasks.length} tasks due to subscription downgrade`
            : 'No Gmail integrations to disable'
        };
      }

      return {
        success: true,
        disabled_tasks_count: 0,
        message: 'No changes needed for this subscription tier'
      };

    } catch (error) {
      console.error('Error handling subscription downgrade:', error);
      throw error;
    }
  }

  /**
   * Update Gmail scope permission for a task (called after Google OAuth)
   * @param {string} userId - User ID
   * @param {string} taskId - Task ID (optional, if null updates all user's tasks)
   * @param {boolean} granted - Whether scope was granted
   * @returns {Promise<Object>} Update result
   */
  async updateGmailScopePermission(userId, taskId = null, granted = true) {
    try {
      let query, params;
      
      if (taskId) {
        // Update specific task
        query = `
          UPDATE tasks 
          SET 
            gmail_scope_granted = $1,
            gmail_last_sync = CASE WHEN $1 = true THEN NOW() ELSE gmail_last_sync END,
            updated_at = NOW()
          WHERE id = $2 AND user_id = $3 AND gmail_integration_enabled = true AND deleted_at IS NULL
          RETURNING id, title
        `;
        params = [granted, taskId, userId];
      } else {
        // Update all user's enabled Gmail integrations
        query = `
          UPDATE tasks 
          SET 
            gmail_scope_granted = $1,
            gmail_last_sync = CASE WHEN $1 = true THEN NOW() ELSE gmail_last_sync END,
            updated_at = NOW()
          WHERE user_id = $2 AND gmail_integration_enabled = true AND deleted_at IS NULL
          RETURNING id, title
        `;
        params = [granted, userId];
      }

      const result = await pool.query(query, params);

      return {
        success: true,
        updated_tasks_count: result.rows.length,
        updated_tasks: result.rows,
        scope_granted: granted,
        message: granted 
          ? `Gmail permissions granted for ${result.rows.length} tasks`
          : `Gmail permissions revoked for ${result.rows.length} tasks`
      };

    } catch (error) {
      console.error('Error updating Gmail scope permission:', error);
      throw error;
    }
  }

  /**
   * Get Gmail integration summary for user (for dashboard/settings)
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Gmail integration summary
   */
  async getGmailIntegrationSummary(userId) {
    try {
      const permission = await this.checkGmailPermission(userId);
      
      if (!permission.canUseGmail) {
        return {
          available: false,
          reason: permission.reason,
          subscription_tier: permission.subscription_tier,
          enabled_tasks_count: 0,
          authorized_tasks_count: 0
        };
      }

      const result = await pool.query(`
        SELECT 
          COUNT(*) as total_tasks,
          COUNT(CASE WHEN gmail_integration_enabled = true THEN 1 END) as enabled_tasks,
          COUNT(CASE WHEN gmail_integration_enabled = true AND gmail_scope_granted = true THEN 1 END) as authorized_tasks,
          MAX(gmail_last_sync) as last_sync
        FROM tasks 
        WHERE user_id = $1 AND deleted_at IS NULL
      `, [userId]);

      const stats = result.rows[0];

      return {
        available: true,
        subscription_tier: permission.subscription_tier,
        total_tasks: parseInt(stats.total_tasks),
        enabled_tasks_count: parseInt(stats.enabled_tasks),
        authorized_tasks_count: parseInt(stats.authorized_tasks),
        last_sync: stats.last_sync,
        needs_authorization: parseInt(stats.enabled_tasks) > parseInt(stats.authorized_tasks)
      };

    } catch (error) {
      console.error('Error getting Gmail integration summary:', error);
      throw error;
    }
  }
}

export default new GmailIntegrationService();
