-- Add indexes for analytics queries to improve performance

-- Index for time-based execution queries
CREATE INDEX IF NOT EXISTS idx_executions_started_at 
ON executions(started_at DESC);

-- Index for workflow execution counts (composite)
CREATE INDEX IF NOT EXISTS idx_executions_workflow_id_started 
ON executions(workflow_id, started_at DESC);

-- Index for workflow metadata queries
CREATE INDEX IF NOT EXISTS idx_workflows_created_at 
ON workflows(created_at DESC);

-- Composite index for recent activity queries
CREATE INDEX IF NOT EXISTS idx_executions_status_started 
ON executions(status, started_at DESC);

-- Index for workflow updates (for activity feed)
CREATE INDEX IF NOT EXISTS idx_workflows_updated_at 
ON workflows(updated_at DESC);
