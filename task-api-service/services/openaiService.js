import OpenAI from 'openai';
import { AppError } from '../middleware/errorHandler.js';

class OpenAIService {
  constructor() {
    this.openai = null;
  }

  // Lazy initialization of OpenAI client
  getClient() {
    if (!this.openai) {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is required');
      }

      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        organization: process.env.OPENAI_ORGANIZATION_ID,
      });
    }
    return this.openai;
  }

  /**
   * Generate a single task suggestion using OpenAI
   * @returns {Promise<Object>} A single suggested task
   */
  async generateTaskSuggestion() {
    try {
      const openai = this.getClient();
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that suggests healthy, user-friendly daily tasks to improve productivity and well-being."
          },
          {
            role: "user",
            content: "Suggest one healthy, productive task like 'go for a run', 'read a book for 30 minutes', or 'call a friend'. Return only the task title, nothing else."
          }
        ],
        max_tokens: 50,
        temperature: 0.8, // Higher temperature for more variety
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new AppError('No suggestion generated', 500);
      }

      // Clean up the response and return a single task
      const title = content.trim().replace(/^[-•*]\s*/, ''); // Remove any bullet points

      return {
        title: title,
        description: `AI-generated suggestion: ${title}`,
        is_ai_generated: true
      };

    } catch (error) {
      console.error('OpenAI API error:', error);
      if (error instanceof AppError) {
        throw error;
      }
      // Handle specific OpenAI errors
      if (error.status === 429) {
        throw new AppError('OpenAI API quota exceeded. Please check your billing details.', 429);
      }
      if (error.status === 401) {
        throw new AppError('Invalid OpenAI API key', 401);
      }
      throw new AppError('Failed to generate task suggestion', 500);
    }
  }

  /**
   * Parse and format due date using OpenAI
   * @param {string} userInput - User's natural language date input
   * @returns {Promise<Object>} Formatted date and repeating status
   */
  async parseDueDate(userInput) {
    try {
      const openai = this.getClient();
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a date parsing assistant. Given a user's natural language date input, you need to:
1. If the input is a specific date (like "friday at 4pm", "tomorrow at 2pm", "December 25th"), convert it to ISO format and set repeating to false
2. If the input sounds repeating (like "Mondays at 4pm", "every Tuesday", "daily at 9am"), keep it as descriptive text and set repeating to true

Current date and time: ${new Date().toISOString()}

Response format (JSON only):
{
  "formatted_date": "YYYY-MM-DDTHH:mm:ss.sssZ" or "descriptive text for repeating",
  "is_repeating": true/false,
  "confidence": "high/medium/low"
}`
          },
          {
            role: "user",
            content: `Parse this date input: "${userInput}"`
          }
        ],
        max_tokens: 200,
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new AppError('No date parsing result', 500);
      }

      try {
        const parsed = JSON.parse(content);
        return {
          due_date: parsed.formatted_date,
          is_repeating: parsed.is_repeating || false,
          confidence: parsed.confidence || 'medium',
          original_input: userInput
        };
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', content);
        throw new AppError('Invalid date format returned', 500);
      }

    } catch (error) {
      console.error('OpenAI date parsing error:', error);
      if (error instanceof AppError) {
        throw error;
      }
      // Handle specific OpenAI errors
      if (error.status === 429) {
        throw new AppError('OpenAI API quota exceeded. Please check your billing details.', 429);
      }
      if (error.status === 401) {
        throw new AppError('Invalid OpenAI API key', 401);
      }
      throw new AppError('Failed to parse due date', 500);
    }
  }

  /**
   * Get default onboarding tasks for new users
   * @returns {Array} Array of onboarding tasks
   */
  getOnboardingTasks() {
    return [
      {
        title: "Create 5 tasks in Onyx",
        description: "Get familiar with Onyx by creating your first 5 tasks. Try different types of tasks like work items, personal goals, or daily activities.",
        is_onboarding: true,
        priority: 'high'
      },
      {
        title: "Test adding notes to tasks - document your work!",
        description: "Learn how to add detailed notes to your tasks. This helps you track progress, add context, and remember important details.",
        is_onboarding: true,
        priority: 'medium'
      },
      {
        title: "Ask a question to the AI assistant",
        description: "Try out the AI assistant feature! Ask for task suggestions, help with planning, or any questions about productivity.",
        is_onboarding: true,
        priority: 'medium'
      }
    ];
  }
}

export default new OpenAIService();
