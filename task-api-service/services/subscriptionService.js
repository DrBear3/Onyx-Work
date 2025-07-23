import pool from '../db/pool.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Subscription Service for managing user subscription tiers and limits
 */
class SubscriptionService {
  
  /**
   * Get user's subscription information
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Subscription details
   */
  async getUserSubscription(userId) {
    try {
      const result = await pool.query(
        'SELECT subscription FROM app_users WHERE user_id = $1 AND deleted_at IS NULL',
        [userId]
      );

      if (!result.rows[0]) {
        throw new AppError('User not found', 404);
      }

      const subscription = result.rows[0].subscription || 'free';
      
      return {
        tier: subscription,
        limits: this.getSubscriptionLimits(subscription),
        processing_type: this.getProcessingType(subscription)
      };
    } catch (error) {
      console.error('Error getting user subscription:', error);
      throw error;
    }
  }

  /**
   * Get subscription limits based on tier
   * @param {string} tier - Subscription tier (free, premium, plaid)
   * @returns {Object} Subscription limits
   */
  getSubscriptionLimits(tier) {
    const limits = {
      free: {
        daily_ai_questions: 3,
        unlimited: false,
        features: ['basic_ai_responses', 'task_context']
      },
      premium: {
        daily_ai_questions: null, // unlimited
        unlimited: true,
        features: ['basic_ai_responses', 'task_context', 'advanced_suggestions']
      },
      plaid: {
        daily_ai_questions: null, // unlimited
        unlimited: true,
        features: ['premium_ai_responses', 'full_context', 'advanced_suggestions', 'custom_prompts']
      }
    };

    return limits[tier] || limits.free;
  }

  /**
   * Get processing type based on subscription tier
   * @param {string} tier - Subscription tier
   * @returns {string} Processing type
   */
  getProcessingType(tier) {
    const processingTypes = {
      free: 'standard',
      premium: 'standard',
      plaid: 'premium'
    };

    return processingTypes[tier] || 'standard';
  }

  /**
   * Check if user has exceeded daily AI question limit
   * @param {string} userId - User ID
   * @param {string} tier - Subscription tier
   * @returns {Promise<Object>} Usage status
   */
  async checkDailyUsage(userId, tier) {
    try {
      const limits = this.getSubscriptionLimits(tier);
      
      // If unlimited, always allow
      if (limits.unlimited) {
        return {
          allowed: true,
          usage: 0,
          limit: null,
          remaining: null
        };
      }

      // Get today's usage count
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      
      const usageQuery = await pool.query(`
        SELECT COUNT(*) as total_questions
        FROM (
          SELECT created_at FROM task_ai_messages 
          WHERE user_id = $1 AND from_user = true 
          AND DATE(created_at) = $2
          UNION ALL
          SELECT created_at FROM assistant_messages 
          WHERE user_id = $1 AND from_user = true 
          AND DATE(created_at) = $2
        ) combined_messages
      `, [userId, today]);

      const usage = parseInt(usageQuery.rows[0].total_questions);
      const limit = limits.daily_ai_questions;
      const remaining = Math.max(0, limit - usage);
      const allowed = usage < limit;

      return {
        allowed,
        usage,
        limit,
        remaining
      };
    } catch (error) {
      console.error('Error checking daily usage:', error);
      throw new AppError('Failed to check usage limits', 500);
    }
  }

  /**
   * Validate if user can make AI request
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Validation result with subscription info
   */
  async validateAIRequest(userId) {
    try {
      const subscription = await this.getUserSubscription(userId);
      const usage = await this.checkDailyUsage(userId, subscription.tier);

      if (!usage.allowed) {
        return {
          allowed: false,
          subscription,
          usage,
          error: `Daily limit of ${usage.limit} AI questions exceeded. Upgrade to Premium for unlimited access.`
        };
      }

      return {
        allowed: true,
        subscription,
        usage
      };
    } catch (error) {
      console.error('Error validating AI request:', error);
      throw error;
    }
  }

  /**
   * Get AI processing configuration based on subscription tier
   * @param {string} tier - Subscription tier
   * @returns {Object} Processing configuration
   */
  getAIProcessingConfig(tier) {
    const configs = {
      free: {
        model: 'gpt-3.5-turbo',
        max_tokens: 150,
        temperature: 0.7,
        context_depth: 'minimal', // Basic task info only
        features: ['basic_suggestions']
      },
      premium: {
        model: 'gpt-3.5-turbo',
        max_tokens: 300,
        temperature: 0.7,
        context_depth: 'full', // Full task context
        features: ['advanced_suggestions', 'context_analysis']
      },
      plaid: {
        model: 'gpt-4', // Premium model for plaid users
        max_tokens: 500,
        temperature: 0.8,
        context_depth: 'comprehensive', // Full context + user patterns
        features: ['premium_suggestions', 'deep_analysis', 'custom_prompts']
      }
    };

    return configs[tier] || configs.free;
  }

  /**
   * Log AI usage for analytics and billing
   * @param {string} userId - User ID
   * @param {string} tier - Subscription tier
   * @param {string} messageType - Type of message (task_specific or general_assistant)
   * @param {number} tokensUsed - Number of tokens used in the request
   * @returns {Promise<void>}
   */
  async logAIUsage(userId, tier, messageType, tokensUsed = 0) {
    try {
      // This could be expanded to a separate usage tracking table
      console.log('AI Usage:', {
        userId,
        tier,
        messageType,
        tokensUsed,
        timestamp: new Date().toISOString()
      });

      // TODO: Implement detailed usage tracking table if needed
      // await pool.query(`
      //   INSERT INTO ai_usage_logs (user_id, subscription_tier, message_type, tokens_used, created_at)
      //   VALUES ($1, $2, $3, $4, NOW())
      // `, [userId, tier, messageType, tokensUsed]);

    } catch (error) {
      console.error('Error logging AI usage:', error);
      // Don't throw error for logging failures
    }
  }
}

export default new SubscriptionService();
