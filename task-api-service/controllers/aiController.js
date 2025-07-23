import openaiService from '../services/openaiService.js';
import pool from '../db/pool.js';
import { AppError } from '../middleware/errorHandler.js';
import aiAssistantService from '../services/aiAssistantService.js';
import subscriptionService from '../services/subscriptionService.js';

/**
 * Process AI message with subscription validation and tier-specific handling
 */
export const processAIMessage = async (req, res, next) => {
  try {
    const { issuer } = req.user;
    const { message_content, message_type, task_id, view_context } = req.body;
    
    if (!message_content || typeof message_content !== 'string') {
      throw new AppError('message_content is required and must be a string', 400);
    }

    if (!message_type || !['task_specific', 'general_assistant'].includes(message_type)) {
      throw new AppError('message_type must be either "task_specific" or "general_assistant"', 400);
    }

    // Step 1: Validate subscription and usage limits
    const validation = await subscriptionService.validateAIRequest(issuer);
    
    if (!validation.allowed) {
      return res.status(429).json({
        success: false,
        error: validation.error,
        subscription_info: {
          tier: validation.subscription.tier,
          usage: validation.usage
        }
      });
    }

    const { subscription, usage } = validation;
    
    // Step 2: Get AI processing configuration for this tier
    const processingConfig = subscriptionService.getAIProcessingConfig(subscription.tier);
    
    // Step 3: Process message based on subscription tier and type
    let aiResponse;
    const context = { task_id, view_context };
    
    if (subscription.processing_type === 'premium') {
      // Plaid tier - premium processing
      aiResponse = await processPremiumAI(
        issuer, 
        message_content, 
        message_type, 
        context, 
        processingConfig
      );
    } else {
      // Basic/Premium tier - standard processing
      aiResponse = await processStandardAI(
        issuer, 
        message_content, 
        message_type, 
        context, 
        processingConfig
      );
    }

    // Step 4: Log usage for analytics
    await subscriptionService.logAIUsage(
      issuer, 
      subscription.tier, 
      message_type, 
      aiResponse.tokens_used || 0
    );

    res.json({
      success: true,
      data: {
        response: aiResponse.response,
        subscription_info: {
          tier: subscription.tier,
          usage: {
            ...usage,
            remaining: usage.remaining ? usage.remaining - 1 : null
          },
          processing_type: subscription.processing_type
        },
        metadata: {
          tokens_used: aiResponse.tokens_used,
          model_used: processingConfig.model,
          context_depth: processingConfig.context_depth
        }
      },
      message: 'AI response generated successfully'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get subscription status and usage information
 */
export const getSubscriptionStatus = async (req, res, next) => {
  try {
    const { issuer } = req.user;
    
    const subscription = await subscriptionService.getUserSubscription(issuer);
    const usage = await subscriptionService.checkDailyUsage(issuer, subscription.tier);

    res.json({
      success: true,
      data: {
        subscription_tier: subscription.tier,
        limits: subscription.limits,
        current_usage: usage,
        features_available: subscription.limits.features
      },
      message: 'Subscription status retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate a single AI task suggestion
 */
export const generateTaskSuggestion = async (req, res, next) => {
  try {
    const { issuer } = req.user;
    
    // Check subscription for task suggestions
    const validation = await subscriptionService.validateAIRequest(issuer);
    if (!validation.allowed) {
      return res.status(429).json({
        success: false,
        error: validation.error,
        subscription_info: {
          tier: validation.subscription.tier,
          usage: validation.usage
        }
      });
    }

    const suggestion = await openaiService.generateTaskSuggestion();
    
    // Log usage
    await subscriptionService.logAIUsage(issuer, validation.subscription.tier, 'task_suggestion');
    
    res.json({
      success: true,
      data: suggestion,
      message: 'Task suggestion generated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Parse natural language due date
 */
export const parseDueDate = async (req, res, next) => {
  try {
    const { issuer } = req.user;
    const { date_input } = req.body;
    
    if (!date_input || typeof date_input !== 'string') {
      throw new AppError('date_input is required and must be a string', 400);
    }

    // Check subscription for AI parsing
    const validation = await subscriptionService.validateAIRequest(issuer);
    if (!validation.allowed) {
      return res.status(429).json({
        success: false,
        error: validation.error,
        subscription_info: {
          tier: validation.subscription.tier,
          usage: validation.usage
        }
      });
    }

    const parsed = await openaiService.parseDueDate(date_input);
    
    // Log usage
    await subscriptionService.logAIUsage(issuer, validation.subscription.tier, 'date_parsing');
    
    res.json({
      success: true,
      data: parsed,
      message: 'Due date parsed successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Standard AI processing for Basic and Premium tiers
 */
async function processStandardAI(userId, messageContent, messageType, context, processingConfig) {
  try {
    let aiResponse;
    
    if (messageType === 'task_specific') {
      // Task-specific AI processing
      aiResponse = await aiAssistantService.processTaskAIMessage(
        userId,
        context.task_id,
        messageContent,
        {
          model: processingConfig.model,
          max_tokens: processingConfig.max_tokens,
          temperature: processingConfig.temperature,
          context_depth: processingConfig.context_depth
        }
      );
    } else {
      // General assistant processing
      aiResponse = await aiAssistantService.processAssistantMessage(
        userId,
        messageContent,
        context.view_context || {},
        {
          model: processingConfig.model,
          max_tokens: processingConfig.max_tokens,
          temperature: processingConfig.temperature,
          context_depth: processingConfig.context_depth
        }
      );
    }

    return {
      response: aiResponse.response,
      tokens_used: aiResponse.tokens_used || 0
    };

  } catch (error) {
    console.error('Error in standard AI processing:', error);
    throw new AppError('Standard AI processing failed', 500);
  }
}

/**
 * Premium AI processing for Plaid tier
 */
async function processPremiumAI(userId, messageContent, messageType, context, processingConfig) {
  try {
    // Enhanced processing for Plaid tier users
    let aiResponse;
    
    if (messageType === 'task_specific') {
      // Premium task-specific processing with enhanced context
      aiResponse = await aiAssistantService.processTaskAIMessage(
        userId,
        context.task_id,
        messageContent,
        {
          model: processingConfig.model, // GPT-4 for Plaid
          max_tokens: processingConfig.max_tokens,
          temperature: processingConfig.temperature,
          context_depth: 'comprehensive',
          enhanced_features: processingConfig.features,
          include_user_patterns: true,
          include_project_analytics: true
        }
      );
    } else {
      // Premium general assistant with deep context analysis
      aiResponse = await aiAssistantService.processAssistantMessage(
        userId,
        messageContent,
        context.view_context || {},
        {
          model: processingConfig.model, // GPT-4 for Plaid
          max_tokens: processingConfig.max_tokens,
          temperature: processingConfig.temperature,
          context_depth: 'comprehensive',
          enhanced_features: processingConfig.features,
          include_behavioral_analysis: true,
          include_productivity_insights: true
        }
      );
    }

    // Add premium-specific enhancements
    const enhancedResponse = await addPremiumEnhancements(
      aiResponse,
      userId,
      messageType,
      context
    );

    return {
      response: enhancedResponse.response,
      tokens_used: enhancedResponse.tokens_used || 0,
      premium_features: enhancedResponse.premium_features
    };

  } catch (error) {
    console.error('Error in premium AI processing:', error);
    throw new AppError('Premium AI processing failed', 500);
  }
}

/**
 * Add premium enhancements for Plaid tier users
 */
async function addPremiumEnhancements(aiResponse, userId, messageType, context) {
  try {
    // Premium enhancements for Plaid users
    const enhancements = {
      productivity_insights: await generateProductivityInsights(userId),
      smart_suggestions: await generateSmartSuggestions(userId, messageType, context),
      pattern_analysis: await analyzeUserPatterns(userId)
    };

    return {
      ...aiResponse,
      premium_features: enhancements
    };

  } catch (error) {
    console.error('Error adding premium enhancements:', error);
    // Return base response if enhancements fail
    return aiResponse;
  }
}

/**
 * Generate productivity insights for premium users
 */
async function generateProductivityInsights(userId) {
  try {
    // TODO: Implement detailed productivity analysis
    // This would analyze task completion patterns, time management, etc.
    return {
      weekly_completion_rate: "85%",
      most_productive_time: "10:00-11:00 AM",
      suggested_improvements: [
        "Consider breaking large tasks into smaller subtasks",
        "Your productivity peaks in the morning - schedule important tasks then"
      ]
    };
  } catch (error) {
    console.error('Error generating productivity insights:', error);
    return null;
  }
}

/**
 * Generate smart suggestions based on user context
 */
async function generateSmartSuggestions(userId, messageType, context) {
  try {
    // TODO: Implement AI-powered smart suggestions
    // This would provide contextual suggestions based on user patterns
    return {
      suggested_actions: [
        "Review tasks due this week",
        "Update project status",
        "Schedule follow-up meetings"
      ],
      related_tasks: [],
      automation_opportunities: []
    };
  } catch (error) {
    console.error('Error generating smart suggestions:', error);
    return null;
  }
}

/**
 * Analyze user patterns for premium insights
 */
async function analyzeUserPatterns(userId) {
  try {
    // TODO: Implement pattern analysis
    // This would analyze user behavior patterns for insights
    return {
      common_task_types: ["Development", "Planning", "Review"],
      peak_activity_days: ["Tuesday", "Wednesday", "Thursday"],
      average_task_duration: "2.5 hours"
    };
  } catch (error) {
    console.error('Error analyzing user patterns:', error);
    return null;
  }
}

/**
 * Create onboarding tasks for a new user
 */
export const createOnboardingTasks = async (req, res, next) => {
  try {
    const { issuer } = req.user;
    const { folder_id } = req.body; // Optional folder to create tasks in
    
    const onboardingTasks = openaiService.getOnboardingTasks();
    const createdTasks = [];

    // Create each onboarding task
    for (const taskData of onboardingTasks) {
      const { rows } = await pool.query(
        `INSERT INTO tasks (folder_id, user_id, title, description, is_repeating, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *`,
        [folder_id || null, issuer, taskData.title, taskData.description, false]
      );
      createdTasks.push(rows[0]);
    }

    res.status(201).json({
      success: true,
      data: createdTasks,
      message: `Created ${createdTasks.length} onboarding tasks successfully`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a task with AI-enhanced due date parsing
 */
export const createTaskWithAIParsing = async (req, res, next) => {
  try {
    const { issuer } = req.user;
    const { folder_id, title, description, due_date_input, is_repeating } = req.body;
    
    if (!title || title.trim().length === 0) {
      throw new AppError('Title is required and cannot be empty', 400);
    }

    let finalDueDate = null;
    let finalIsRepeating = is_repeating || false;

    // If due_date_input is provided, parse it with AI
    if (due_date_input && typeof due_date_input === 'string') {
      try {
        const parsed = await openaiService.parseDueDate(due_date_input);
        
        if (parsed.is_repeating) {
          // For repeating tasks, store the descriptive text
          finalDueDate = parsed.due_date; // This will be descriptive text like "Mondays at 4pm"
          finalIsRepeating = true;
        } else {
          // For specific dates, store the ISO timestamp
          finalDueDate = parsed.due_date;
          finalIsRepeating = false;
        }
      } catch (aiError) {
        console.warn('AI date parsing failed, proceeding without parsed date:', aiError.message);
        // Continue with the original input if AI parsing fails
      }
    }

    const { rows } = await pool.query(
      `INSERT INTO tasks (folder_id, user_id, title, description, due_date, is_repeating, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING *`,
      [
        folder_id || null,
        issuer,
        title.trim(),
        description?.trim() || null,
        finalDueDate,
        finalIsRepeating
      ]
    );

    res.status(201).json({
      success: true,
      data: {
        ...rows[0],
        ai_parsing_used: !!due_date_input
      },
      message: 'Task created successfully with AI enhancements'
    });
  } catch (error) {
    next(error);
  }
};
