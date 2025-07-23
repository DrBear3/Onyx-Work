// controllers/assistantMessagesController.js
import pool from '../db/pool.js';
import aiAssistantService from '../services/aiAssistantService.js';
import subscriptionService from '../services/subscriptionService.js';
import { AppError } from '../middleware/errorHandler.js';

// List assistant messages for the user
export const getAssistantMessages = async (req, res, next) => {
  try {
    const { issuer } = req.user;
    const { rows } = await pool.query(
      'SELECT * FROM assistant_messages WHERE user_id = $1 ORDER BY created_at DESC',
      [issuer]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

// Get a single assistant message by id
export const getAssistantMessageById = async (req, res, next) => {
  try {
    const { issuer } = req.user;
    const { id } = req.params;
    const { rows } = await pool.query(
      'SELECT * FROM assistant_messages WHERE id = $1 AND user_id = $2',
      [id, issuer]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Assistant message not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

// Create an assistant message with subscription-aware AI processing
export const createAssistantMessage = async (req, res, next) => {
  try {
    const { issuer } = req.user;
    const { message, from_user, from_ai, view_context } = req.body;
    
    // If this is a user message asking a question, process with AI
    if (from_user && !from_ai && message && message.trim().length > 0) {
      try {
        // Step 1: Validate subscription and usage limits
        const validation = await subscriptionService.validateAIRequest(issuer);
        
        if (!validation.allowed) {
          // Save user message but return subscription limit error
          const { rows } = await pool.query(
            `INSERT INTO assistant_messages (user_id, message, from_user, from_ai)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [issuer, message, true, false]
          );
          
          return res.status(429).json({
            success: false,
            error: validation.error,
            data: {
              user_message: rows[0]
            },
            subscription_info: {
              tier: validation.subscription.tier,
              usage: validation.usage
            }
          });
        }

        const { subscription, usage } = validation;
        
        // Step 2: Get AI processing configuration for this tier
        const processingConfig = subscriptionService.getAIProcessingConfig(subscription.tier);
        
        // Step 3: Process the message through AI assistant service with subscription context
        const aiResponse = await aiAssistantService.processAssistantMessage(
          issuer, 
          message, 
          view_context || {},
          {
            subscription_tier: subscription.tier,
            processing_type: subscription.processing_type,
            ...processingConfig
          }
        );
        
        // Step 4: Save both user message and AI response
        const savedMessages = await aiAssistantService.saveAIMessage(
          issuer, 
          null, // No task_id for general assistant
          message, 
          aiResponse.response, 
          'general_assistant'
        );

        // Step 5: Log usage for analytics
        await subscriptionService.logAIUsage(
          issuer, 
          subscription.tier, 
          'general_assistant', 
          aiResponse.tokens_used || 0
        );

        return res.status(201).json({
          success: true,
          data: {
            user_message: savedMessages.user_message,
            ai_response: savedMessages.ai_response,
            context_used: aiResponse.context_used
          },
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
          },
          message: 'Assistant message processed successfully'
        });

      } catch (aiError) {
        console.error('AI processing failed:', aiError);
        // Fall back to saving just the user message
        const { rows } = await pool.query(
          `INSERT INTO assistant_messages (user_id, message, from_user, from_ai)
           VALUES ($1, $2, $3, $4) RETURNING *`,
          [issuer, message, true, false]
        );
        
        return res.status(201).json({
          success: true,
          data: rows[0],
          message: 'Message saved, AI processing temporarily unavailable',
          warning: 'AI response could not be generated'
        });
      }
    } else {
      // Handle regular message creation (AI responses, etc.)
      const { rows } = await pool.query(
        `INSERT INTO assistant_messages (user_id, message, from_user, from_ai)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [issuer, message, from_user || false, from_ai || false]
      );
      
      res.status(201).json({
        success: true,
        data: rows[0],
        message: 'Assistant message created successfully'
      });
    }
  } catch (err) {
    next(err);
  }
};

// Update an assistant message
export const updateAssistantMessage = async (req, res, next) => {
  try {
    const { message, from_user, from_ai } = req.body;
    const { issuer } = req.user;
    const { id } = req.params;
    const { rows } = await pool.query(
      `UPDATE assistant_messages
       SET message = COALESCE($1, message),
           from_user = COALESCE($2, from_user),
           from_ai = COALESCE($3, from_ai)
       WHERE id = $4 AND user_id = $5
       RETURNING *`,
      [message, from_user, from_ai, id, issuer]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Assistant message not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

// Delete an assistant message (hard delete, as schema has no deleted_at)
export const deleteAssistantMessage = async (req, res, next) => {
  try {
    const { issuer } = req.user;
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM assistant_messages WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, issuer]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Assistant message not found' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};