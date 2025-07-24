-- Add Gmail integration fields to tasks table
-- This migration adds columns needed for per-task Gmail integration

-- Add Gmail integration fields to tasks table
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS gmail_integration_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS gmail_scope_granted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS gmail_last_sync TIMESTAMP DEFAULT NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_gmail_integration_enabled 
ON tasks (gmail_integration_enabled) WHERE gmail_integration_enabled = TRUE;

CREATE INDEX IF NOT EXISTS idx_tasks_gmail_scope_granted 
ON tasks (gmail_scope_granted) WHERE gmail_scope_granted = TRUE;

-- Update existing tasks to have default values
UPDATE tasks 
SET gmail_integration_enabled = FALSE,
    gmail_scope_granted = FALSE,
    gmail_last_sync = NULL
WHERE gmail_integration_enabled IS NULL 
   OR gmail_scope_granted IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN tasks.gmail_integration_enabled IS 'Whether Gmail integration is enabled for this specific task';
COMMENT ON COLUMN tasks.gmail_scope_granted IS 'Whether user has granted Gmail OAuth scopes for this task';
COMMENT ON COLUMN tasks.gmail_last_sync IS 'Last time Gmail integration was synced for this task';
