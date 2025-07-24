import gmailIntegrationService from '../services/gmailIntegrationService.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Get Gmail integration status for a specific task
 */
export const getTaskGmailStatus = async (req, res, next) => {
  try {
    const { issuer } = req.user;
    const { taskId } = req.params;

    if (!taskId) {
      throw new AppError('Task ID is required', 400);
    }

    const status = await gmailIntegrationService.getGmailIntegrationStatus(issuer, taskId);

    res.json({
      success: true,
      data: status,
      message: 'Gmail integration status retrieved successfully'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Toggle Gmail integration for a specific task
 */
export const toggleTaskGmailIntegration = async (req, res, next) => {
  try {
    const { issuer } = req.user;
    const { taskId } = req.params;
    const { enabled } = req.body;

    if (!taskId) {
      throw new AppError('Task ID is required', 400);
    }

    if (typeof enabled !== 'boolean') {
      throw new AppError('enabled field must be a boolean', 400);
    }

    const result = await gmailIntegrationService.toggleGmailIntegration(issuer, taskId, enabled);

    res.json({
      success: true,
      data: result,
      message: result.message
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Check Gmail integration permission for user
 */
export const checkGmailPermission = async (req, res, next) => {
  try {
    const { issuer } = req.user;

    const permission = await gmailIntegrationService.checkGmailPermission(issuer);

    res.json({
      success: true,
      data: permission,
      message: 'Gmail permission status retrieved successfully'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get Gmail integration summary for user
 */
export const getGmailIntegrationSummary = async (req, res, next) => {
  try {
    const { issuer } = req.user;

    const summary = await gmailIntegrationService.getGmailIntegrationSummary(issuer);

    res.json({
      success: true,
      data: summary,
      message: 'Gmail integration summary retrieved successfully'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Handle Gmail OAuth callback (after user grants permissions)
 */
export const handleGmailOAuthCallback = async (req, res, next) => {
  try {
    const { issuer } = req.user;
    const { taskId, granted = true } = req.body;

    // Update Gmail scope permission
    const result = await gmailIntegrationService.updateGmailScopePermission(
      issuer, 
      taskId || null, 
      granted
    );

    res.json({
      success: true,
      data: result,
      message: result.message
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Handle subscription changes that affect Gmail integration
 * (Called internally by Stripe webhooks)
 */
export const handleGmailSubscriptionChange = async (userId, newTier) => {
  try {
    return await gmailIntegrationService.handleSubscriptionDowngrade(userId, newTier);
  } catch (error) {
    console.error('Error handling Gmail subscription change:', error);
    throw error;
  }
};
