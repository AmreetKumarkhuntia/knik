-- Conversation History Storage
-- Stores AI chat conversations with full message history as JSONB

CREATE TABLE IF NOT EXISTS conversations (
    id              TEXT PRIMARY KEY,
    title           TEXT,
    messages        JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Hash index on id for O(1) lookups by conversation_id
CREATE INDEX IF NOT EXISTS idx_conversations_id_hash
    ON conversations USING hash (id);

-- B-tree index for listing conversations by recency
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at
    ON conversations (updated_at DESC);
