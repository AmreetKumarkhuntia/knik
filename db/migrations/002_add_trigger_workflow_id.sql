-- Add trigger_workflow_id to replace cron_expression

ALTER TABLE schedules ADD COLUMN trigger_workflow_id TEXT;
ALTER TABLE schedules ADD CONSTRAINT fk_trigger_workflow FOREIGN KEY (trigger_workflow_id) REFERENCES workflows(id) ON DELETE CASCADE;

-- We can drop cron_expression, or keep it nullable for now. Let's drop it to fully commit to the new design.
ALTER TABLE schedules DROP COLUMN cron_expression;
ALTER TABLE schedules ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE schedules ADD COLUMN last_executed_at TIMESTAMP WITH TIME ZONE;
