-- Add summary columns to conversations table for context summarization.
-- summary: compressed summary text of earlier messages (NULL if no summarization)
-- summary_through_index: message index up to which the summary covers (NULL if none)

ALTER TABLE conversations ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS summary_through_index INTEGER;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS total_tokens INTEGER DEFAULT 0;
