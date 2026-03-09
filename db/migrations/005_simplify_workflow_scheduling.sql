-- Simplify workflow scheduling by directly referencing target workflows
-- This migration removes the need for trigger workflows and stores schedule metadata directly

-- Drop the foreign key constraint
ALTER TABLE schedules DROP CONSTRAINT IF EXISTS fk_trigger_workflow;

-- Rename trigger_workflow_id to target_workflow_id
ALTER TABLE schedules RENAME COLUMN trigger_workflow_id TO target_workflow_id;

-- Add schedule metadata fields
ALTER TABLE schedules ADD COLUMN schedule_description TEXT;
ALTER TABLE schedules ADD COLUMN trigger_type TEXT DEFAULT 'code';

-- Add comments for clarity
COMMENT ON COLUMN schedules.target_workflow_id IS 'The ID of the workflow to be triggered when this schedule fires';
COMMENT ON COLUMN schedules.schedule_description IS 'Natural language description of when the schedule should trigger (e.g., "daily at 9am")';
COMMENT ON COLUMN schedules.trigger_type IS 'Type of trigger: "code" for dateparser-based, "ai" for AI-based evaluation';
