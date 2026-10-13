-- Add trigger_workflow_id to replace cron_expression

-- 005 renames trigger_workflow_id to target_workflow_id, so on a database that is already past 005
-- neither column is re-added.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'schedules'
          AND column_name IN ('trigger_workflow_id', 'target_workflow_id')
    ) THEN
        ALTER TABLE schedules ADD COLUMN trigger_workflow_id TEXT;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'schedules'
          AND column_name = 'trigger_workflow_id'
    ) AND NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_trigger_workflow' AND conrelid = 'schedules'::regclass
    ) THEN
        ALTER TABLE schedules ADD CONSTRAINT fk_trigger_workflow FOREIGN KEY (trigger_workflow_id) REFERENCES workflows(id) ON DELETE CASCADE;
    END IF;
END $$;

-- We can drop cron_expression, or keep it nullable for now. Let's drop it to fully commit to the new design.
ALTER TABLE schedules DROP COLUMN IF EXISTS cron_expression;
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS last_executed_at TIMESTAMP WITH TIME ZONE;
