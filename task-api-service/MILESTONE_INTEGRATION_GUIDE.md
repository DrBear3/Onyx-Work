# Milestone System Integration Guide

## Overview
The milestone system tracks user achievements and shows contextual upgrade suggestions when users complete 100 tasks. The system provides different messages based on subscription tiers.

## Backend Implementation ✅

### Database Schema
- **Table**: `user_milestones`
- **Purpose**: Track which milestones users have achieved/seen
- **Key Fields**: `user_id`, `milestone_type`, `achieved_at`

### API Endpoints

#### 1. Task Completion (Modified)
**Endpoint**: `PUT /api/v1/tasks/:id/toggle-completion`

**Enhanced Response**:
```json
{
  "success": true,
  "data": { /* task data */ },
  "message": "Task completed successfully",
  "milestones": [
    {
      "type": "milestone_achievement",
      "milestone": "tasks_100_completed",
      "title": "🎉 Amazing! You've completed 100 tasks!",
      "message": "You've built quite a productivity history! With 100+ completed tasks...",
      "current_tier": "free",
      "suggested_tier": "premium",
      "benefits": [
        "Unlimited AI task assistance",
        "Advanced productivity insights from your 100+ tasks",
        "Smart task suggestions based on your patterns",
        "Priority support"
      ],
      "cta_text": "Upgrade to Premium",
      "cta_action": "upgrade_to_premium",
      "completed_tasks": 100,
      "achieved_at": "2025-07-23T21:00:00.000Z"
    }
  ]
}
```

#### 2. Check Pending Milestones
**Endpoint**: `GET /api/v1/milestones/check`

**Response**:
```json
{
  "success": true,
  "data": [ /* array of pending milestone objects */ ],
  "count": 1,
  "has_pending": true
}
```

#### 3. Dismiss Milestone
**Endpoint**: `POST /api/v1/milestones/tasks_100_completed/dismiss`

**Response**:
```json
{
  "success": true,
  "message": "Milestone dismissed successfully"
}
```

#### 4. Get Milestone Stats
**Endpoint**: `GET /api/v1/milestones/stats`

**Response**:
```json
{
  "success": true,
  "data": {
    "task_stats": {
      "total_tasks": 150,
      "completed_tasks": 105,
      "pending_tasks": 45
    },
    "milestones_achieved": 1,
    "milestone_types": ["tasks_100_completed"],
    "progress_to_100_tasks": 100,
    "has_reached_100_tasks": true
  }
}
```

## Frontend Integration Guide

### 1. Task Completion Handler
```javascript
// When user completes a task
async function toggleTaskCompletion(taskId) {
  const response = await fetch(`/api/v1/tasks/${taskId}/toggle-completion`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await response.json();
  
  // Check for milestone notifications
  if (data.milestones && data.milestones.length > 0) {
    showMilestoneModal(data.milestones[0]);
  }
  
  return data;
}
```

### 2. Milestone Modal Component
```jsx
function MilestoneModal({ milestone, onClose, onUpgrade, onDismiss }) {
  return (
    <div className="milestone-modal-overlay">
      <div className="milestone-modal">
        <h2>{milestone.title}</h2>
        <p>{milestone.message}</p>
        
        <div className="milestone-benefits">
          <h3>Benefits of {milestone.suggested_tier}:</h3>
          <ul>
            {milestone.benefits.map((benefit, index) => (
              <li key={index}>{benefit}</li>
            ))}
          </ul>
        </div>
        
        <div className="milestone-actions">
          {milestone.cta_action === 'upgrade_to_premium' && (
            <button onClick={() => onUpgrade('premium')} className="btn-upgrade">
              {milestone.cta_text}
            </button>
          )}
          {milestone.cta_action === 'upgrade_to_plaid' && (
            <button onClick={() => onUpgrade('plaid')} className="btn-upgrade">
              {milestone.cta_text}
            </button>
          )}
          {milestone.cta_action === 'continue_productivity' && (
            <button onClick={onClose} className="btn-continue">
              {milestone.cta_text}
            </button>
          )}
          <button onClick={onDismiss} className="btn-dismiss">
            Not Now
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 3. App-level Milestone Checker
```javascript
// Check for pending milestones on app load
async function checkPendingMilestones() {
  const response = await fetch('/api/v1/milestones/check', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await response.json();
  
  if (data.has_pending) {
    // Show milestone notification
    showMilestoneModal(data.data[0]);
  }
}

// Call this when app loads or user navigates to main dashboard
useEffect(() => {
  checkPendingMilestones();
}, []);
```

### 4. Progress Indicator Component
```jsx
function TaskProgressIndicator() {
  const [stats, setStats] = useState(null);
  
  useEffect(() => {
    fetch('/api/v1/milestones/stats')
      .then(res => res.json())
      .then(data => setStats(data.data));
  }, []);
  
  if (!stats || stats.has_reached_100_tasks) return null;
  
  const progress = (stats.task_stats.completed_tasks / 100) * 100;
  
  return (
    <div className="progress-indicator">
      <p>Complete {100 - stats.task_stats.completed_tasks} more tasks to unlock premium features!</p>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }}></div>
      </div>
      <span>{stats.task_stats.completed_tasks}/100 tasks completed</span>
    </div>
  );
}
```

### 5. Dismiss Milestone
```javascript
async function dismissMilestone(milestoneType) {
  await fetch(`/api/v1/milestones/${milestoneType}/dismiss`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
}
```

## Message Variations by Tier

### Free Tier (0 questions/day → Premium)
- **Title**: "🎉 Amazing! You've completed 100 tasks!"
- **Focus**: Premium features, unlimited AI
- **CTA**: "Upgrade to Premium"

### Premium Tier (Unlimited → Plaid)
- **Title**: "🚀 100 Tasks Complete - You're a Productivity Pro!"
- **Focus**: Fine-tuned AI, Gmail integration, advanced analytics
- **CTA**: "Upgrade to Plaid"

### Plaid Tier (Already top tier)
- **Title**: "🏆 Productivity Master - 100 Tasks Complete!"
- **Focus**: Congratulations, continue using advanced features
- **CTA**: "Keep Going!"

## Timing and Triggers

1. **When Triggered**: When user completes their 100th task
2. **One-Time**: Each milestone type shown only once per user
3. **Immediate**: Shows immediately after task completion
4. **Persistent**: Available via `/milestones/check` until dismissed
5. **Dismissible**: User can dismiss without upgrading

## Analytics Opportunities

- Track milestone achievement rates by tier
- Measure conversion rates from milestone to upgrade
- Monitor task completion patterns leading to milestones
- A/B test different milestone messages

This system creates a natural upgrade funnel based on user engagement and provides value-driven upgrade suggestions at the perfect moment! 🚀
