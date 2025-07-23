import pool from '../db/pool.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * AI Assistant Service for handling task-specific and general assistant queries
 * This service prepares context and will send to AI service when ready
 */
class AIAssistantService {
  
  /**
   * Process a task-specific AI question
   * Gathers all task context including task details, notes, and message history
   * @param {string} userId - User ID
   * @param {number} taskId - Task ID
   * @param {string} userMessage - User's question
   * @returns {Promise<Object>} AI response with context
   */
  async processTaskAIMessage(userId, taskId, userMessage) {
    try {
      // Gather comprehensive task context
      const taskContext = await this.gatherTaskContext(userId, taskId);
      
      // Prepare the context for AI service
      const aiRequest = {
        type: 'task_specific',
        user_message: userMessage,
        context: taskContext,
        timestamp: new Date().toISOString()
      };

      // TODO: Send to AI service when ready
      // const aiResponse = await this.sendToAIService(aiRequest);
      
      // For now, return a placeholder response with context
      const placeholderResponse = {
        message: `I understand you're asking about task "${taskContext.task.title}". Your question: "${userMessage}". AI service will process this with full task context when ready.`,
        context_used: {
          task_title: taskContext.task.title,
          has_notes: taskContext.notes.length > 0,
          has_subtasks: taskContext.subtasks.length > 0,
          message_history_count: taskContext.messageHistory.length,
          task_status: taskContext.task.completed_at ? 'completed' : 'pending'
        },
        from_ai: true,
        timestamp: new Date().toISOString()
      };

      return placeholderResponse;

    } catch (error) {
      console.error('Error processing task AI message:', error);
      throw new AppError('Failed to process task AI message', 500);
    }
  }

  /**
   * Process a general assistant question
   * Gathers context from user's current view (visible tasks and folders)
   * @param {string} userId - User ID
   * @param {string} userMessage - User's question
   * @param {Object} viewContext - Current view context from frontend
   * @returns {Promise<Object>} AI response with context
   */
  async processAssistantMessage(userId, userMessage, viewContext = {}) {
    try {
      // Gather context from user's current view
      const assistantContext = await this.gatherAssistantContext(userId, viewContext);
      
      // Prepare the context for AI service
      const aiRequest = {
        type: 'general_assistant',
        user_message: userMessage,
        context: assistantContext,
        view_context: viewContext,
        timestamp: new Date().toISOString()
      };

      // TODO: Send to AI service when ready
      // const aiResponse = await this.sendToAIService(aiRequest);
      
      // For now, return a placeholder response with context
      const placeholderResponse = {
        message: `I can help you with your productivity questions. Your question: "${userMessage}". I can see you have ${assistantContext.visible_tasks.length} tasks and ${assistantContext.visible_folders.length} folders in your current view.`,
        context_used: {
          visible_tasks_count: assistantContext.visible_tasks.length,
          visible_folders_count: assistantContext.visible_folders.length,
          current_view: viewContext.current_view || 'unknown',
          total_pending_tasks: assistantContext.user_stats.pending_tasks,
          total_completed_tasks: assistantContext.user_stats.completed_tasks
        },
        from_ai: true,
        timestamp: new Date().toISOString()
      };

      return placeholderResponse;

    } catch (error) {
      console.error('Error processing assistant message:', error);
      throw new AppError('Failed to process assistant message', 500);
    }
  }

  /**
   * Gather comprehensive context for a specific task
   * @param {string} userId - User ID
   * @param {number} taskId - Task ID
   * @returns {Promise<Object>} Complete task context
   */
  async gatherTaskContext(userId, taskId) {
    try {
      // Get task details
      const taskQuery = await pool.query(
        'SELECT * FROM tasks WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL',
        [taskId, userId]
      );

      if (!taskQuery.rows[0]) {
        throw new AppError('Task not found', 404);
      }

      const task = taskQuery.rows[0];

      // Get task notes
      const notesQuery = await pool.query(
        'SELECT * FROM notes WHERE task_id = $1 AND user_id = $2 AND deleted_at IS NULL ORDER BY created_at DESC',
        [taskId, userId]
      );

      // Get subtasks
      const subtasksQuery = await pool.query(
        'SELECT * FROM subtasks WHERE task_id = $1 AND user_id = $2 AND deleted_at IS NULL ORDER BY created_at ASC',
        [taskId, userId]
      );

      // Get message history for this task
      const messageHistoryQuery = await pool.query(
        'SELECT * FROM task_ai_messages WHERE task_id = $1 AND user_id = $2 ORDER BY created_at ASC',
        [taskId, userId]
      );

      // Get folder context if task belongs to one
      let folder = null;
      if (task.folder_id) {
        const folderQuery = await pool.query(
          'SELECT * FROM folders WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL',
          [task.folder_id, userId]
        );
        folder = folderQuery.rows[0] || null;
      }

      return {
        task: task,
        folder: folder,
        notes: notesQuery.rows,
        subtasks: subtasksQuery.rows,
        messageHistory: messageHistoryQuery.rows,
        metadata: {
          total_notes: notesQuery.rows.length,
          total_subtasks: subtasksQuery.rows.length,
          completed_subtasks: subtasksQuery.rows.filter(st => st.completed_at).length,
          total_messages: messageHistoryQuery.rows.length,
          last_updated: task.updated_at,
          is_overdue: task.due_date && new Date(task.due_date) < new Date() && !task.completed_at
        }
      };

    } catch (error) {
      console.error('Error gathering task context:', error);
      throw error;
    }
  }

  /**
   * Gather context for general assistant based on user's current view
   * @param {string} userId - User ID
   * @param {Object} viewContext - Current view context from frontend
   * @returns {Promise<Object>} Assistant context
   */
  async gatherAssistantContext(userId, viewContext) {
    try {
      // Get visible tasks based on view context
      let visibleTasks = [];
      if (viewContext.visible_task_ids && viewContext.visible_task_ids.length > 0) {
        const taskIds = viewContext.visible_task_ids.map((_, index) => `$${index + 2}`).join(',');
        const visibleTasksQuery = await pool.query(
          `SELECT * FROM tasks WHERE user_id = $1 AND id IN (${taskIds}) AND deleted_at IS NULL`,
          [userId, ...viewContext.visible_task_ids]
        );
        visibleTasks = visibleTasksQuery.rows;
      } else {
        // If no specific tasks provided, get recent tasks
        const recentTasksQuery = await pool.query(
          'SELECT * FROM tasks WHERE user_id = $1 AND deleted_at IS NULL ORDER BY updated_at DESC LIMIT 10',
          [userId]
        );
        visibleTasks = recentTasksQuery.rows;
      }

      // Get visible folders
      let visibleFolders = [];
      if (viewContext.visible_folder_ids && viewContext.visible_folder_ids.length > 0) {
        const folderIds = viewContext.visible_folder_ids.map((_, index) => `$${index + 2}`).join(',');
        const visibleFoldersQuery = await pool.query(
          `SELECT * FROM folders WHERE user_id = $1 AND id IN (${folderIds}) AND deleted_at IS NULL`,
          [userId, ...viewContext.visible_folder_ids]
        );
        visibleFolders = visibleFoldersQuery.rows;
      } else {
        // Get all folders if none specified
        const allFoldersQuery = await pool.query(
          'SELECT * FROM folders WHERE user_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC',
          [userId]
        );
        visibleFolders = allFoldersQuery.rows;
      }

      // Get user statistics
      const statsQuery = await pool.query(`
        SELECT 
          COUNT(*) FILTER (WHERE completed_at IS NULL) as pending_tasks,
          COUNT(*) FILTER (WHERE completed_at IS NOT NULL) as completed_tasks,
          COUNT(*) as total_tasks
        FROM tasks 
        WHERE user_id = $1 AND deleted_at IS NULL
      `, [userId]);

      const userStats = statsQuery.rows[0];

      // Get recent activity
      const recentActivityQuery = await pool.query(`
        SELECT 'task' as type, title as name, updated_at, completed_at
        FROM tasks 
        WHERE user_id = $1 AND deleted_at IS NULL 
        ORDER BY updated_at DESC 
        LIMIT 5
      `, [userId]);

      return {
        visible_tasks: visibleTasks,
        visible_folders: visibleFolders,
        user_stats: {
          pending_tasks: parseInt(userStats.pending_tasks),
          completed_tasks: parseInt(userStats.completed_tasks),
          total_tasks: parseInt(userStats.total_tasks)
        },
        recent_activity: recentActivityQuery.rows,
        view_info: {
          current_view: viewContext.current_view || 'dashboard',
          current_folder: viewContext.current_folder_id || null,
          filters_applied: viewContext.filters || {},
          sort_order: viewContext.sort_order || 'updated_at'
        }
      };

    } catch (error) {
      console.error('Error gathering assistant context:', error);
      throw error;
    }
  }

  /**
   * Placeholder for future AI service integration
   * @param {Object} aiRequest - Request to send to AI service
   * @returns {Promise<Object>} AI response
   */
  async sendToAIService(aiRequest) {
    // TODO: Implement actual AI service call
    // This could be OpenAI, Claude, or custom AI service
    
    console.log('AI Service Request (placeholder):', {
      type: aiRequest.type,
      message_length: aiRequest.user_message.length,
      context_keys: Object.keys(aiRequest.context),
      timestamp: aiRequest.timestamp
    });

    // Placeholder response
    return {
      message: "AI service response placeholder",
      confidence: 0.85,
      sources_used: ['task_data', 'user_context'],
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Save AI message to database
   * @param {string} userId - User ID
   * @param {number|null} taskId - Task ID (null for general assistant)
   * @param {string} userMessage - User's message
   * @param {string} aiResponse - AI's response
   * @param {string} type - Message type ('task_specific' or 'general_assistant')
   * @returns {Promise<Object>} Saved message record
   */
  async saveAIMessage(userId, taskId, userMessage, aiResponse, type) {
    try {
      if (type === 'task_specific' && taskId) {
        // Save to task_ai_messages
        const result = await pool.query(
          `INSERT INTO task_ai_messages (user_id, task_id, message, from_user, from_ai, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *`,
          [userId, taskId, userMessage, true, false]
        );

        // Save AI response
        const aiResult = await pool.query(
          `INSERT INTO task_ai_messages (user_id, task_id, message, from_user, from_ai, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *`,
          [userId, taskId, aiResponse, false, true]
        );

        return {
          user_message: result.rows[0],
          ai_response: aiResult.rows[0]
        };
      } else {
        // Save to assistant_messages
        const result = await pool.query(
          `INSERT INTO assistant_messages (user_id, message, from_user, from_ai, created_at, updated_at)
           VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING *`,
          [userId, userMessage, true, false]
        );

        // Save AI response
        const aiResult = await pool.query(
          `INSERT INTO assistant_messages (user_id, message, from_user, from_ai, created_at, updated_at)
           VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING *`,
          [userId, aiResponse, false, true]
        );

        return {
          user_message: result.rows[0],
          ai_response: aiResult.rows[0]
        };
      }
    } catch (error) {
      console.error('Error saving AI message:', error);
      throw new AppError('Failed to save AI message', 500);
    }
  }
}

export default new AIAssistantService();
