-- Remove workflow_id from schedules table
-- The trigger workflow now determines which workflow to trigger via its output

-- First drop the foreign key constraint if it exists
ALTER TABLE schedules DROP CONSTRAINT IF EXISTS schedules_workflow_id_fkey;

-- Drop the workflow_id column
ALTER TABLE schedules DROP COLUMN IF EXISTS workflow_id;
