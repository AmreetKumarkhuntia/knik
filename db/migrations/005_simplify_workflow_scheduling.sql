-- Simplify workflow scheduling by directly referencing target workflows
-- This migration removes the need for trigger workflows and stores schedule metadata directly

-- Drop the foreign key constraint
ALTER TABLE schedules DROP CONSTRAINT IF EXISTS fk_trigger_workflow;

-- Rename trigger_workflow_id to target_workflow_id
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'schedules'
          AND column_name = 'trigger_workflow_id'
    ) THEN
        ALTER TABLE schedules RENAME COLUMN trigger_workflow_id TO target_workflow_id;
    END IF;
END $$;

-- Add schedule metadata fields
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS schedule_description TEXT;

-- Add comments for clarity
COMMENT ON COLUMN schedules.target_workflow_id IS 'The ID of the workflow to be triggered when this schedule fires';
COMMENT ON COLUMN schedules.schedule_description IS 'Natural language description of when the schedule should trigger (e.g., "daily at 9am")';

-- trigger_type is dropped again by 006, so only add it to a database that 006 has not reached yet
-- (006 adds next_run_at). Re-adding and re-dropping it would use up one of the table's 1600 column
-- numbers on every re-run, because Postgres never reuses the number of a dropped column.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'schedules'
          AND column_name = 'next_run_at'
    ) THEN
        ALTER TABLE schedules ADD COLUMN IF NOT EXISTS trigger_type TEXT DEFAULT 'code';
        COMMENT ON COLUMN schedules.trigger_type IS 'Type of trigger: "code" for dateparser-based, "ai" for AI-based evaluation';
    END IF;
END $$;
