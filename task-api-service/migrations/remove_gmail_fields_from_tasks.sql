-- Remove Gmail integration fields from tasks table
-- These fields are being moved to the integrations table instead

-- Drop the Gmail-specific columns from tasks table
ALTER TABLE tasks 
DROP COLUMN IF EXISTS gmail_integration_enabled,
DROP COLUMN IF EXISTS gmail_scope_granted,
DROP COLUMN IF EXISTS gmail_last_sync;

-- Drop the indexes we created
DROP INDEX IF EXISTS idx_tasks_gmail_integration_enabled;
DROP INDEX IF EXISTS idx_tasks_gmail_scope_granted;

-- Gmail integration will now be handled globally through the integrations table
-- The integrations table already has:
-- - gmail BOOLEAN (whether Gmail integration is enabled)
-- - status BOOLEAN (whether the integration is active)
-- This provides global per-user Gmail integration control rather than per-task
