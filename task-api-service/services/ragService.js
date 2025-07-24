import pool from '../db/pool.js';
import OpenAI from 'openai';
import { AppError } from '../middleware/errorHandler.js';

/**
 * RAG (Retrieval-Augmented Generation) Service
 * Searches user's historical tasks and content to provide context for AI responses
 */
class RAGService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      organization: process.env.OPENAI_ORGANIZATION_ID
    });
  }

  /**
   * Determine if a user question is a general/internet search vs personal task question
   * @param {string} userMessage - User's question
   * @returns {Promise<Object>} Classification result
   */
  async classifyQuestion(userMessage) {
    try {
      const classificationPrompt = `
Analyze this user question and determine if it's:
1. PERSONAL - About their tasks, work, personal productivity, or requires context from their data
2. GENERAL - A general knowledge question, current events, or internet search needed

Question: "${userMessage}"

Respond with JSON only:
{
  "type": "PERSONAL" | "GENERAL",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation"
}
`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: classificationPrompt }],
        temperature: 0.1,
        max_tokens: 150
      });

      const result = JSON.parse(response.choices[0].message.content);
      return result;

    } catch (error) {
      console.error('Error classifying question:', error);
      // Default to PERSONAL if classification fails
      return {
        type: 'PERSONAL',
        confidence: 0.5,
        reasoning: 'Classification failed, defaulting to personal'
      };
    }
  }

  /**
   * Search user's tasks and related content for relevant context
   * @param {string} userId - User ID
   * @param {string} userMessage - User's question
   * @param {number} limit - Maximum number of results
   * @returns {Promise<Object>} Relevant context from user's data
   */
  async searchUserContext(userId, userMessage, limit = 10) {
    try {
      // Extract key terms from the user message for better search
      const searchTerms = await this.extractSearchTerms(userMessage);
      
      // Search across tasks, notes, and message history
      const [tasks, notes, messages] = await Promise.all([
        this.searchTasks(userId, searchTerms, Math.ceil(limit * 0.6)),
        this.searchNotes(userId, searchTerms, Math.ceil(limit * 0.3)),
        this.searchMessages(userId, searchTerms, Math.ceil(limit * 0.1))
      ]);

      // Combine and rank results
      const combinedContext = {
        relevant_tasks: tasks,
        relevant_notes: notes,
        relevant_messages: messages,
        search_terms: searchTerms,
        total_results: tasks.length + notes.length + messages.length
      };

      return combinedContext;

    } catch (error) {
      console.error('Error searching user context:', error);
      throw new AppError('Failed to search user context', 500);
    }
  }

  /**
   * Extract key search terms from user message
   * @param {string} userMessage - User's question
   * @returns {Promise<Array>} Array of search terms
   */
  async extractSearchTerms(userMessage) {
    try {
      const extractionPrompt = `
Extract the most important keywords and phrases from this user question for searching their task history.
Focus on nouns, important verbs, dates, and specific topics.

Question: "${userMessage}"

Return JSON array of 3-8 key terms:
["term1", "term2", "term3"]
`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: extractionPrompt }],
        temperature: 0.1,
        max_tokens: 100
      });

      const terms = JSON.parse(response.choices[0].message.content);
      return Array.isArray(terms) ? terms : [userMessage];

    } catch (error) {
      console.error('Error extracting search terms:', error);
      // Fallback to simple word extraction
      return userMessage.toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 3)
        .slice(0, 5);
    }
  }

  /**
   * Search user's tasks for relevant content
   * @param {string} userId - User ID
   * @param {Array} searchTerms - Search terms
   * @param {number} limit - Result limit
   * @returns {Promise<Array>} Relevant tasks
   */
  async searchTasks(userId, searchTerms, limit) {
    try {
      const searchPattern = searchTerms.join('|');
      
      const query = `
        SELECT t.*, f.title as folder_title,
               ts_rank(to_tsvector('english', coalesce(t.title, '') || ' ' || coalesce(t.description, '')), 
                       plainto_tsquery('english', $2)) as rank
        FROM tasks t
        LEFT JOIN folders f ON t.folder_id = f.id
        WHERE t.user_id = $1 
          AND t.deleted_at IS NULL
          AND (
            t.title ILIKE $3
            OR t.description ILIKE $3
            OR to_tsvector('english', coalesce(t.title, '') || ' ' || coalesce(t.description, '')) 
               @@ plainto_tsquery('english', $2)
          )
        ORDER BY 
          rank DESC,
          t.updated_at DESC
        LIMIT $4
      `;

      const { rows } = await pool.query(query, [
        userId,
        searchTerms.join(' '),
        `%${searchPattern}%`,
        limit
      ]);

      return rows.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        folder_title: task.folder_title,
        completed_at: task.completed_at,
        created_at: task.created_at,
        updated_at: task.updated_at,
        relevance: 'task'
      }));

    } catch (error) {
      console.error('Error searching tasks:', error);
      return [];
    }
  }

  /**
   * Search user's notes for relevant content
   * @param {string} userId - User ID
   * @param {Array} searchTerms - Search terms
   * @param {number} limit - Result limit
   * @returns {Promise<Array>} Relevant notes
   */
  async searchNotes(userId, searchTerms, limit) {
    try {
      const searchPattern = searchTerms.join('|');
      
      const query = `
        SELECT n.*, t.title as task_title,
               ts_rank(to_tsvector('english', n.content), plainto_tsquery('english', $2)) as rank
        FROM notes n
        LEFT JOIN tasks t ON n.task_id = t.id
        WHERE n.user_id = $1 
          AND n.deleted_at IS NULL
          AND (
            n.content ILIKE $3
            OR to_tsvector('english', n.content) @@ plainto_tsquery('english', $2)
          )
        ORDER BY 
          rank DESC,
          n.updated_at DESC
        LIMIT $4
      `;

      const { rows } = await pool.query(query, [
        userId,
        searchTerms.join(' '),
        `%${searchPattern}%`,
        limit
      ]);

      return rows.map(note => ({
        id: note.id,
        content: note.content,
        task_title: note.task_title,
        task_id: note.task_id,
        created_at: note.created_at,
        updated_at: note.updated_at,
        relevance: 'note'
      }));

    } catch (error) {
      console.error('Error searching notes:', error);
      return [];
    }
  }

  /**
   * Search user's AI message history for relevant content
   * @param {string} userId - User ID
   * @param {Array} searchTerms - Search terms
   * @param {number} limit - Result limit
   * @returns {Promise<Array>} Relevant messages
   */
  async searchMessages(userId, searchTerms, limit) {
    try {
      const searchPattern = searchTerms.join('|');
      
      const query = `
        SELECT am.*, t.title as task_title,
               ts_rank(to_tsvector('english', am.message), plainto_tsquery('english', $2)) as rank
        FROM (
          SELECT message, task_id, created_at, 'task_ai' as source 
          FROM task_ai_messages 
          WHERE user_id = $1
          UNION ALL
          SELECT message, null as task_id, created_at, 'assistant' as source 
          FROM assistant_messages 
          WHERE user_id = $1
        ) am
        LEFT JOIN tasks t ON am.task_id = t.id
        WHERE (
          am.message ILIKE $3
          OR to_tsvector('english', am.message) @@ plainto_tsquery('english', $2)
        )
        ORDER BY 
          rank DESC,
          am.created_at DESC
        LIMIT $4
      `;

      const { rows } = await pool.query(query, [
        userId,
        searchTerms.join(' '),
        `%${searchPattern}%`,
        limit
      ]);

      return rows.map(msg => ({
        message: msg.message,
        task_title: msg.task_title,
        task_id: msg.task_id,
        source: msg.source,
        created_at: msg.created_at,
        relevance: 'message'
      }));

    } catch (error) {
      console.error('Error searching messages:', error);
      return [];
    }
  }

  /**
   * Generate RAG-enhanced response using user context
   * @param {string} userMessage - User's question
   * @param {Object} userContext - Retrieved context from user's data
   * @returns {Promise<string>} AI response using context
   */
  async generateRAGResponse(userMessage, userContext) {
    try {
      const contextText = this.formatContextForPrompt(userContext);
      
      const ragPrompt = `
You are a helpful AI assistant for a task management app. Answer the user's question using ONLY the provided context from their personal tasks, notes, and messages.

CONTEXT FROM USER'S TASKS AND NOTES:
${contextText}

USER QUESTION: "${userMessage}"

INSTRUCTIONS:
- Answer based ONLY on the provided context
- If the context doesn't contain relevant information, say so
- Be specific and reference their actual tasks/notes when relevant
- Keep responses helpful and concise
- If you can suggest actions based on their existing tasks, do so

RESPONSE:
`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: ragPrompt }],
        temperature: 0.3,
        max_tokens: 500
      });

      return response.choices[0].message.content.trim();

    } catch (error) {
      console.error('Error generating RAG response:', error);
      throw new AppError('Failed to generate AI response', 500);
    }
  }

  /**
   * Format user context for AI prompt
   * @param {Object} userContext - User context object
   * @returns {string} Formatted context text
   */
  formatContextForPrompt(userContext) {
    let contextText = '';

    // Add relevant tasks
    if (userContext.relevant_tasks && userContext.relevant_tasks.length > 0) {
      contextText += 'RELEVANT TASKS:\n';
      userContext.relevant_tasks.forEach(task => {
        contextText += `- "${task.title}"`;
        if (task.description) contextText += `: ${task.description}`;
        if (task.folder_title) contextText += ` (in folder: ${task.folder_title})`;
        contextText += ` [${task.completed_at ? 'Completed' : 'Pending'}]\n`;
      });
      contextText += '\n';
    }

    // Add relevant notes
    if (userContext.relevant_notes && userContext.relevant_notes.length > 0) {
      contextText += 'RELEVANT NOTES:\n';
      userContext.relevant_notes.forEach(note => {
        contextText += `- ${note.content}`;
        if (note.task_title) contextText += ` (from task: "${note.task_title}")`;
        contextText += '\n';
      });
      contextText += '\n';
    }

    // Add relevant messages
    if (userContext.relevant_messages && userContext.relevant_messages.length > 0) {
      contextText += 'RELEVANT PAST CONVERSATIONS:\n';
      userContext.relevant_messages.forEach(msg => {
        contextText += `- ${msg.message}`;
        if (msg.task_title) contextText += ` (about task: "${msg.task_title}")`;
        contextText += '\n';
      });
    }

    return contextText || 'No relevant context found in user\'s task history.';
  }
}

export default new RAGService();
