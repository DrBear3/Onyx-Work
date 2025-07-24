import OpenAI from 'openai';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Fine-Tuned Model Service
 * Handles AI responses for plaid subscription users using custom fine-tuned models
 */
class FineTunedModelService {
  constructor() {
    // Only initialize OpenAI if API key is available
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        organization: process.env.OPENAI_ORGANIZATION_ID
      });
    } else {
      console.warn('⚠️ OpenAI API key not found - running in test mode');
      this.openai = null;
    }
    
    // Fine-tuned model IDs (these would be created through OpenAI fine-tuning process)
    this.models = {
      task_assistant: process.env.FINETUNED_TASK_MODEL_ID || 'gpt-4o', // Fallback to standard model
      general_assistant: process.env.FINETUNED_GENERAL_MODEL_ID || 'gpt-4o' // Fallback to standard model
    };
  }

  /**
   * Process task-specific questions using fine-tuned model
   * @param {string} userMessage - User's question
   * @param {Object} taskContext - Complete task context
   * @returns {Promise<string>} AI response from fine-tuned model
   */
  async processTaskQuestion(userMessage, taskContext) {
    try {
      if (!this.openai) {
        throw new AppError('OpenAI service not available - API key missing', 503);
      }
      
      const contextPrompt = this.formatTaskContextForFineTuned(taskContext);
      
      const messages = [
        {
          role: 'system',
          content: `You are a specialized AI assistant for task management. You have been fine-tuned on productivity and task management patterns. Provide expert-level insights and suggestions based on the task context.`
        },
        {
          role: 'user',
          content: `TASK CONTEXT:\n${contextPrompt}\n\nUSER QUESTION: ${userMessage}\n\nPlease provide a detailed, expert response with specific recommendations.`
        }
      ];

      const response = await this.openai.chat.completions.create({
        model: this.models.task_assistant,
        messages,
        temperature: 0.2,
        max_tokens: 800,
        top_p: 0.9
      });

      return response.choices[0].message.content.trim();

    } catch (error) {
      console.error('Error with fine-tuned task model:', error);
      throw new AppError('Failed to process with fine-tuned model', 500);
    }
  }

  /**
   * Process general assistant questions using fine-tuned model
   * @param {string} userMessage - User's question
   * @param {Object} userContext - User's productivity context
   * @returns {Promise<string>} AI response from fine-tuned model
   */
  async processGeneralQuestion(userMessage, userContext) {
    try {
      if (!this.openai) {
        throw new AppError('OpenAI service not available - API key missing', 503);
      }
      
      const contextPrompt = this.formatGeneralContextForFineTuned(userContext);
      
      const messages = [
        {
          role: 'system',
          content: `You are an expert productivity and task management AI assistant. You have been fine-tuned on advanced productivity methodologies, task optimization, and personal effectiveness strategies. Provide sophisticated insights and actionable advice.`
        },
        {
          role: 'user',
          content: `USER CONTEXT:\n${contextPrompt}\n\nUSER QUESTION: ${userMessage}\n\nProvide an expert-level response with advanced strategies and personalized recommendations.`
        }
      ];

      const response = await this.openai.chat.completions.create({
        model: this.models.general_assistant,
        messages,
        temperature: 0.3,
        max_tokens: 800,
        top_p: 0.9
      });

      return response.choices[0].message.content.trim();

    } catch (error) {
      console.error('Error with fine-tuned general model:', error);
      throw new AppError('Failed to process with fine-tuned model', 500);
    }
  }

  /**
   * Format task context for fine-tuned model input
   * @param {Object} taskContext - Task context object
   * @returns {string} Formatted context
   */
  formatTaskContextForFineTuned(taskContext) {
    const { task, notes, subtasks, messageHistory, folder } = taskContext;
    
    let context = `TASK: "${task.title}"`;
    if (task.description) context += `\nDESCRIPTION: ${task.description}`;
    if (task.due_date) context += `\nDUE DATE: ${task.due_date}`;
    if (folder) context += `\nFOLDER: ${folder.title}`;
    context += `\nSTATUS: ${task.completed_at ? 'Completed' : 'Pending'}`;
    
    if (subtasks.length > 0) {
      context += `\n\nSUBTASKS (${subtasks.length}):`;
      subtasks.slice(0, 5).forEach(subtask => {
        context += `\n- ${subtask.title} [${subtask.completed_at ? 'Done' : 'Pending'}]`;
      });
    }
    
    if (notes.length > 0) {
      context += `\n\nNOTES (${notes.length}):`;
      notes.slice(0, 3).forEach(note => {
        context += `\n- ${note.content.substring(0, 200)}${note.content.length > 200 ? '...' : ''}`;
      });
    }
    
    if (messageHistory.length > 0) {
      context += `\n\nRECENT CONVERSATION:`;
      messageHistory.slice(-3).forEach(msg => {
        const role = msg.from_user ? 'USER' : 'AI';
        context += `\n${role}: ${msg.message.substring(0, 150)}${msg.message.length > 150 ? '...' : ''}`;
      });
    }
    
    return context;
  }

  /**
   * Format general context for fine-tuned model input
   * @param {Object} userContext - User context object
   * @returns {string} Formatted context
   */
  formatGeneralContextForFineTuned(userContext) {
    const { visible_tasks, visible_folders, user_stats, recent_activity } = userContext;
    
    let context = `USER PRODUCTIVITY OVERVIEW:`;
    context += `\nTotal Pending Tasks: ${user_stats.pending_tasks}`;
    context += `\nTotal Completed Tasks: ${user_stats.completed_tasks}`;
    context += `\nFolders: ${visible_folders.length}`;
    
    if (visible_tasks.length > 0) {
      context += `\n\nCURRENT VISIBLE TASKS (${visible_tasks.length}):`;
      visible_tasks.slice(0, 5).forEach(task => {
        context += `\n- "${task.title}" [${task.completed_at ? 'Completed' : 'Pending'}]`;
        if (task.due_date) context += ` (Due: ${task.due_date})`;
      });
    }
    
    if (visible_folders.length > 0) {
      context += `\n\nFOLDERS:`;
      visible_folders.forEach(folder => {
        context += `\n- ${folder.title} (${folder.task_count} tasks)`;
      });
    }
    
    if (recent_activity && recent_activity.length > 0) {
      context += `\n\nRECENT ACTIVITY:`;
      recent_activity.slice(0, 3).forEach(activity => {
        context += `\n- ${activity.type}: ${activity.name}`;
      });
    }
    
    return context;
  }

  /**
   * Check if fine-tuned models are available
   * @returns {Promise<Object>} Model availability status
   */
  async checkModelAvailability() {
    try {
      if (!this.openai) {
        return {
          task_model_available: false,
          general_model_available: false,
          fallback_to_standard: true,
          error: 'OpenAI API key not configured'
        };
      }
      
      const models = await this.openai.models.list();
      const availableModels = models.data.map(model => model.id);
      
      return {
        task_model_available: availableModels.includes(this.models.task_assistant),
        general_model_available: availableModels.includes(this.models.general_assistant),
        fallback_to_standard: !availableModels.includes(this.models.task_assistant) || 
                             !availableModels.includes(this.models.general_assistant)
      };
      
    } catch (error) {
      console.error('Error checking model availability:', error);
      return {
        task_model_available: false,
        general_model_available: false,
        fallback_to_standard: true
      };
    }
  }

  /**
   * Log fine-tuned model usage for analytics
   * @param {string} userId - User ID
   * @param {string} modelType - Type of model used
   * @param {string} question - User question
   * @param {number} tokensUsed - Tokens consumed
   */
  async logFineTunedUsage(userId, modelType, question, tokensUsed) {
    try {
      console.log('Fine-tuned model usage:', {
        userId,
        modelType,
        model: this.models[modelType],
        questionLength: question.length,
        tokensUsed,
        timestamp: new Date().toISOString()
      });
      
      // TODO: Store in usage analytics table if needed
      
    } catch (error) {
      console.error('Error logging fine-tuned usage:', error);
    }
  }
}

export default new FineTunedModelService();
