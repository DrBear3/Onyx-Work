import OpenAI from 'openai';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Internet Search Service
 * Handles general knowledge questions and internet searches
 */
class InternetSearchService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      organization: process.env.OPENAI_ORGANIZATION_ID
    });
  }

  /**
   * Search the internet and provide a comprehensive answer
   * @param {string} userMessage - User's question
   * @returns {Promise<string>} AI response with internet search results
   */
  async searchAndAnswer(userMessage) {
    try {
      // For now, use GPT-4 with a search-enhanced prompt
      // In the future, this could integrate with actual search APIs like Serp API, Google Custom Search, etc.
      
      const searchPrompt = `
You are a helpful AI assistant with access to current information. The user is asking a general knowledge question that requires internet/world knowledge.

USER QUESTION: "${userMessage}"

Please provide a comprehensive, accurate, and up-to-date answer. If the question involves:
- Current events: Mention that information may be outdated and suggest checking recent sources
- Specific data/numbers: Provide what you know but note the information date
- How-to questions: Give step-by-step guidance
- General knowledge: Provide a thorough explanation

Keep your response informative but concise, and acknowledge any limitations in your knowledge cutoff.

RESPONSE:
`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: searchPrompt }],
        temperature: 0.3,
        max_tokens: 600
      });

      return response.choices[0].message.content.trim();

    } catch (error) {
      console.error('Error in internet search:', error);
      throw new AppError('Failed to search for information', 500);
    }
  }

  /**
   * Enhanced internet search with web browsing capabilities
   * @param {string} userMessage - User's question
   * @returns {Promise<string>} AI response with web search results
   */
  async enhancedWebSearch(userMessage) {
    try {
      // This could integrate with real web search APIs
      // For example: Serp API, Google Custom Search, Bing Search API, etc.
      
      // For now, provide a more detailed response acknowledging the limitation
      const response = await this.searchAndAnswer(userMessage);
      
      return `${response}

*Note: This response is based on my training data. For the most current information, you may want to check recent online sources.*`;

    } catch (error) {
      console.error('Error in enhanced web search:', error);
      throw new AppError('Failed to perform web search', 500);
    }
  }

  /**
   * Integrate with a real search API (placeholder for future implementation)
   * @param {string} query - Search query
   * @returns {Promise<Array>} Search results
   */
  async performRealWebSearch(query) {
    // TODO: Integrate with actual search APIs
    // Examples:
    // - Google Custom Search API
    // - Bing Search API
    // - Serp API
    // - DuckDuckGo API
    
    try {
      // Placeholder implementation
      console.log(`Real web search would be performed for: ${query}`);
      
      // This would return actual search results
      return [
        {
          title: 'Example Search Result',
          snippet: 'This would be a real search result snippet',
          url: 'https://example.com',
          source: 'Example Source'
        }
      ];
      
    } catch (error) {
      console.error('Error performing real web search:', error);
      return [];
    }
  }

  /**
   * Format web search results into a coherent response
   * @param {string} userMessage - Original user question
   * @param {Array} searchResults - Web search results
   * @returns {Promise<string>} Formatted AI response
   */
  async formatSearchResponse(userMessage, searchResults) {
    try {
      if (!searchResults || searchResults.length === 0) {
        return this.searchAndAnswer(userMessage);
      }

      const resultsText = searchResults
        .map(result => `- ${result.title}: ${result.snippet} (Source: ${result.source})`)
        .join('\n');

      const formatPrompt = `
Based on these web search results, provide a comprehensive answer to the user's question.

USER QUESTION: "${userMessage}"

SEARCH RESULTS:
${resultsText}

Please synthesize this information into a clear, helpful answer. Cite sources when relevant and provide a balanced perspective.

RESPONSE:
`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: formatPrompt }],
        temperature: 0.3,
        max_tokens: 700
      });

      return response.choices[0].message.content.trim();

    } catch (error) {
      console.error('Error formatting search response:', error);
      return this.searchAndAnswer(userMessage);
    }
  }
}

export default new InternetSearchService();
