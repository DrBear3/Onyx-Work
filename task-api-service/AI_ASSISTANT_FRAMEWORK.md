# AI Assistant Framework Documentation

This document outlines the AI Assistant framework for handling task-specific and general assistant queries with comprehensive context.

## Overview

The AI Assistant framework provides two main types of interactions:

1. **Task-Specific AI Messages** (`task_ai_messages`) - Questions about specific tasks with full task context
2. **General Assistant Messages** (`assistant_messages`) - General productivity questions with current view context

## Architecture

### Services
- **`aiAssistantService.js`** - Core service handling context gathering and AI processing
- **`openaiService.js`** - OpenAI integration for task suggestions and date parsing

### Controllers
- **`task_ai_messagesController.js`** - Enhanced with AI processing for task-specific queries
- **`assistant_messagesController.js`** - Enhanced with AI processing for general queries

## Task-Specific AI Messages

### Context Gathered
When a user asks a question about a specific task, the system automatically gathers:

- **Task Details**: Title, description, due date, completion status, folder
- **Notes**: All notes associated with the task
- **Subtasks**: All subtasks and their completion status
- **Message History**: Previous AI conversations about this task
- **Folder Context**: Folder information if task belongs to one
- **Metadata**: Statistics like total notes, overdue status, etc.

### API Usage

**POST** `/api/v1/task_ai_messages`

```json
{
  "task_id": 123,
  "message": "How can I break this task into smaller steps?",
  "from_user": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user_message": {
      "id": 456,
      "task_id": 123,
      "message": "How can I break this task into smaller steps?",
      "from_user": true,
      "created_at": "2025-07-23T22:00:00.000Z"
    },
    "ai_response": {
      "id": 457,
      "task_id": 123,
      "message": "Based on your task 'Build mobile app'...",
      "from_ai": true,
      "created_at": "2025-07-23T22:00:01.000Z"
    },
    "context_used": {
      "task_title": "Build mobile app",
      "has_notes": true,
      "has_subtasks": false,
      "message_history_count": 2,
      "task_status": "pending"
    }
  },
  "message": "Task AI message processed successfully"
}
```

## General Assistant Messages

### Context Gathered
For general assistant queries, the system gathers:

- **Visible Tasks**: Tasks currently visible in user's view
- **Visible Folders**: Folders in current view
- **User Statistics**: Total/pending/completed task counts
- **Recent Activity**: Latest task updates
- **View Information**: Current page, filters, sort order

### API Usage

**POST** `/api/v1/assistant_messages`

```json
{
  "message": "What should I focus on today?",
  "from_user": true,
  "view_context": {
    "current_view": "dashboard",
    "visible_task_ids": [1, 2, 3, 4, 5],
    "visible_folder_ids": [1, 2],
    "current_folder_id": null,
    "filters": {
      "status": "pending",
      "priority": "high"
    },
    "sort_order": "due_date"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user_message": {
      "id": 789,
      "message": "What should I focus on today?",
      "from_user": true,
      "created_at": "2025-07-23T22:00:00.000Z"
    },
    "ai_response": {
      "id": 790,
      "message": "Based on your current tasks, I recommend...",
      "from_ai": true,
      "created_at": "2025-07-23T22:00:01.000Z"
    },
    "context_used": {
      "visible_tasks_count": 5,
      "visible_folders_count": 2,
      "current_view": "dashboard",
      "total_pending_tasks": 12,
      "total_completed_tasks": 45
    }
  },
  "message": "Assistant message processed successfully"
}
```

## View Context Structure

The `view_context` object helps the AI understand what the user is currently looking at:

```json
{
  "current_view": "dashboard|folder|search|calendar",
  "visible_task_ids": [1, 2, 3],
  "visible_folder_ids": [1, 2],
  "current_folder_id": 1,
  "filters": {
    "status": "pending|completed",
    "priority": "low|medium|high",
    "due_date": "today|this_week|overdue"
  },
  "sort_order": "created_at|updated_at|due_date|priority|title",
  "search_query": "optional search terms"
}
```

## Context Data Structure

### Task Context (for task-specific queries)
```json
{
  "task": {
    "id": 123,
    "title": "Build mobile app",
    "description": "Create a React Native app...",
    "due_date": "2025-08-01T00:00:00.000Z",
    "completed_at": null,
    "folder_id": 1
  },
  "folder": {
    "id": 1,
    "name": "Work Projects"
  },
  "notes": [
    {
      "id": 1,
      "content": "Research React Native...",
      "created_at": "2025-07-20T10:00:00.000Z"
    }
  ],
  "subtasks": [
    {
      "id": 1,
      "title": "Setup development environment",
      "completed_at": "2025-07-21T15:00:00.000Z"
    }
  ],
  "messageHistory": [
    {
      "id": 1,
      "message": "Previous question about this task",
      "from_user": true
    }
  ],
  "metadata": {
    "total_notes": 3,
    "total_subtasks": 5,
    "completed_subtasks": 2,
    "total_messages": 4,
    "is_overdue": false
  }
}
```

### Assistant Context (for general queries)
```json
{
  "visible_tasks": [
    {
      "id": 1,
      "title": "Task 1",
      "due_date": "2025-07-25T00:00:00.000Z"
    }
  ],
  "visible_folders": [
    {
      "id": 1,
      "name": "Work"
    }
  ],
  "user_stats": {
    "pending_tasks": 12,
    "completed_tasks": 45,
    "total_tasks": 57
  },
  "recent_activity": [
    {
      "type": "task",
      "name": "Updated task",
      "updated_at": "2025-07-23T20:00:00.000Z"
    }
  ],
  "view_info": {
    "current_view": "dashboard",
    "current_folder": null,
    "filters_applied": {},
    "sort_order": "updated_at"
  }
}
```

## Future AI Service Integration

The framework is designed to be easily integrated with any AI service. The `sendToAIService()` method in `aiAssistantService.js` is a placeholder that will:

1. Receive structured context and user questions
2. Send to AI service (OpenAI, Claude, custom model, etc.)
3. Return processed responses
4. Handle errors and fallbacks

## Error Handling

- **Graceful Degradation**: If AI processing fails, user messages are still saved
- **Context Validation**: Ensures all required context is available
- **Fallback Responses**: Provides helpful error messages when AI is unavailable

## Usage Examples

### Frontend Integration

```javascript
// Ask a task-specific question
const askTaskQuestion = async (taskId, question) => {
  const response = await fetch('/api/v1/task_ai_messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      task_id: taskId,
      message: question,
      from_user: true
    })
  });
  return response.json();
};

// Ask a general assistant question
const askAssistant = async (question, viewContext) => {
  const response = await fetch('/api/v1/assistant_messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: question,
      from_user: true,
      view_context: viewContext
    })
  });
  return response.json();
};
```

## Next Steps

1. **Integrate AI Service**: Replace placeholder with actual AI service calls
2. **Add More Context**: Include user preferences, past behavior patterns
3. **Implement Caching**: Cache context for better performance
4. **Add Analytics**: Track AI usage and effectiveness
5. **Enhance Responses**: Add structured responses with actions, suggestions, etc.
