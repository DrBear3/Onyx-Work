# AI Assistant Framework with Subscription-Based Processing

## Overview

The AI Assistant Framework provides subscription-aware AI processing for both task-specific and general assistant interactions. The framework handles different subscription tiers (Free, Premium, Plaid) with varying limits and processing capabilities.

## Subscription Tiers

### Free Tier
- **Daily Limit**: 3 AI questions per day (combined from task_ai_messages and assistant_messages)
- **Processing**: Standard GPT-3.5-turbo with basic context
- **Features**: Basic AI responses, task context
- **Token Limit**: 150 tokens per response

### Premium Tier  
- **Daily Limit**: Unlimited AI questions
- **Processing**: Standard GPT-3.5-turbo with full context
- **Features**: Advanced suggestions, context analysis
- **Token Limit**: 300 tokens per response

### Plaid Tier
- **Daily Limit**: Unlimited AI questions
- **Processing**: Premium GPT-4 with comprehensive context
- **Features**: Premium suggestions, deep analysis, custom prompts, productivity insights
- **Token Limit**: 500 tokens per response

## API Endpoints

### Process AI Message
```
POST /api/ai/message
```

Process an AI message with subscription validation and tier-specific handling.

**Request Body:**
```json
{
  "message_content": "What should I focus on today?",
  "message_type": "general_assistant", // or "task_specific"
  "task_id": "uuid-here", // required for task_specific
  "view_context": {
    "current_page": "dashboard",
    "active_filters": ["urgent"],
    "visible_tasks": 5
  }
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "response": "Based on your current tasks...",
    "subscription_info": {
      "tier": "premium",
      "usage": {
        "usage": 2,
        "limit": null,
        "remaining": null,
        "allowed": true
      },
      "processing_type": "standard"
    },
    "metadata": {
      "tokens_used": 245,
      "model_used": "gpt-3.5-turbo",
      "context_depth": "full"
    }
  },
  "message": "AI response generated successfully"
}
```

**Response (Limit Exceeded):**
```json
{
  "success": false,
  "error": "Daily limit of 3 AI questions exceeded. Upgrade to Premium for unlimited access.",
  "subscription_info": {
    "tier": "basic",
    "usage": {
      "usage": 3,
      "limit": 3,
      "remaining": 0,
      "allowed": false
    }
  }
}
```

### Get Subscription Status
```
GET /api/ai/subscription-status
```

**Response:**
```json
{
  "success": true,
  "data": {
    "subscription_tier": "premium",
    "limits": {
      "daily_ai_questions": null,
      "unlimited": true,
      "features": ["basic_ai_responses", "task_context", "advanced_suggestions"]
    },
    "current_usage": {
      "usage": 5,
      "limit": null,
      "remaining": null,
      "allowed": true
    },
    "features_available": ["basic_ai_responses", "task_context", "advanced_suggestions"]
  }
}
```

## Enhanced Controllers

### Task AI Messages Controller
- **Subscription Validation**: Checks user's subscription tier and daily usage before processing
- **Tier-Specific Processing**: Uses different AI models and parameters based on subscription
- **Usage Tracking**: Logs AI usage for analytics and billing

### Assistant Messages Controller  
- **View Context Processing**: Includes user's current view state in AI processing
- **Subscription-Aware Responses**: Adjusts response quality and features based on tier
- **Premium Enhancements**: Adds productivity insights for Plaid users

## Services

### Subscription Service
```javascript
// Check if user can make AI request
const validation = await subscriptionService.validateAIRequest(userId);

// Get subscription-specific AI configuration
const config = subscriptionService.getAIProcessingConfig(tier);

// Track usage for analytics
await subscriptionService.logAIUsage(userId, tier, messageType, tokensUsed);
```

### AI Assistant Service
Enhanced with subscription-aware processing:

```javascript
// Process with subscription context
const response = await aiAssistantService.processTaskAIMessage(
  userId, 
  taskId, 
  message, 
  {
    subscription_tier: 'premium',
    processing_type: 'standard',
    model: 'gpt-3.5-turbo',
    context_depth: 'full'
  }
);
```

## Premium Features (Plaid Tier Only)

### Productivity Insights
- Weekly completion rate analysis
- Peak productivity time identification
- Personalized improvement suggestions

### Smart Suggestions
- Contextual action recommendations
- Related task identification
- Automation opportunity detection

### Pattern Analysis
- Common task type identification
- Peak activity day analysis
- Average task duration tracking

## Usage Tracking

The framework tracks AI usage for:
- **Daily Limits**: Enforcing subscription-based limits
- **Analytics**: Understanding user patterns and feature usage
- **Billing**: Potential future token-based billing

## Error Handling

### Subscription Limit Exceeded
- Returns 429 status code
- Saves user message without AI processing
- Provides clear upgrade path messaging

### AI Processing Failures
- Falls back to saving user message only
- Returns warning about temporary unavailability
- Maintains system reliability

## Integration Points

### Frontend Integration
The frontend should:
1. Send view_context with assistant messages for better AI responses
2. Handle subscription limit errors gracefully
3. Display subscription status and usage information
4. Provide upgrade prompts when limits are reached

### Database Schema
The framework expects:
- `app_users.subscription` field (basic/premium/plaid)
- Existing message tables (task_ai_messages, assistant_messages)
- Optional: ai_usage_logs table for detailed tracking

## Configuration

### Environment Variables
```
OPENAI_API_KEY=sk-proj-...
OPENAI_ORG_ID=org-...
NODE_ENV=development
```

### Subscription Limits Configuration
Located in `subscriptionService.getSubscriptionLimits()`:
- Easily configurable per-tier limits
- Feature flags per subscription level
- Token limits and model selections

## Next Steps

1. **AI Service Integration**: Replace placeholder `sendToAIService()` with actual AI provider
2. **Usage Analytics**: Implement detailed usage tracking table
3. **Premium Feature Development**: Expand productivity insights and pattern analysis
4. **Frontend Updates**: Add subscription status UI and usage indicators
5. **Testing**: Comprehensive testing with different subscription scenarios

## Legacy Endpoints (Still Available)

### Generate Task Suggestion
```
GET /api/ai/suggestion
```
Now includes subscription checking before generating suggestions.

### Parse Due Date
```
POST /api/ai/parse-date
```
Now includes subscription validation before AI parsing.

### Direct Message Controllers
The original task_ai_messages and assistant_messages endpoints still work but now include subscription handling:
- `POST /api/task-ai-messages` - Enhanced with subscription validation
- `POST /api/assistant-messages` - Enhanced with subscription validation

## Architecture Components

### Core Services
1. **SubscriptionService** - Manages subscription tiers, limits, and validation
2. **AIController** - Centralized AI processing with subscription awareness
3. **Enhanced Message Controllers** - Updated with subscription integration

### Message Flow
1. User sends message → Controller receives request
2. Subscription validation → Check tier and usage limits
3. AI processing → Use tier-appropriate model and features
4. Response generation → Include subscription info and metadata
5. Usage logging → Track for analytics and billing

This framework provides a complete subscription-aware AI assistant system that scales from basic users to premium enterprise customers while maintaining clear usage boundaries and upgrade paths.
