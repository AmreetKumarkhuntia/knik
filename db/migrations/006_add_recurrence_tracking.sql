-- Add recurrence tracking to schedules
-- This migration adds next_run_at and recurrence_seconds columns
-- and removes deprecated evaluation-related columns

-- Add recurrence tracking columns
ALTER TABLE schedules ADD COLUMN next_run_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE schedules ADD COLUMN recurrence_seconds INTEGER;

-- Remove deprecated columns
ALTER TABLE schedules DROP COLUMN IF EXISTS trigger_type;
ALTER TABLE schedules DROP COLUMN IF EXISTS evaluation_workflow_id;

-- Ensure workflows has timestamps with defaults
ALTER TABLE workflows ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE workflows ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

-- Ensure schedules has timestamps with defaults
ALTER TABLE schedules ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE schedules ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

-- Add comments for documentation
COMMENT ON COLUMN schedules.next_run_at IS
    'Next scheduled execution time (UTC timezone-aware)';
COMMENT ON COLUMN schedules.recurrence_seconds IS
    'Recurrence interval in seconds (e.g., 21600 for 6 hours, 86400 for 1 day)';
