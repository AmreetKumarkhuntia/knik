-- New compaction model: summary_message_id replaces summary/summary_through_index.
-- Old messages are never deleted; summary_message_id acts as a pointer so only
-- messages from that point onwards are sent to the LLM.
-- compacted_count tracks consecutive failures for the circuit breaker.

ALTER TABLE conversations ADD COLUMN IF NOT EXISTS summary_message_id TEXT;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS compacted_count INTEGER DEFAULT 0;
