-- Conversation owners. A bot user gets a users row the first time the bot sees them, so they keep their id across
-- restarts; each conversation records who started it (user_id) and from which app (source).
-- Rows from before this migration have neither and stay that way: they are the legacy rows.

CREATE TABLE IF NOT EXISTS users (
    id           TEXT PRIMARY KEY,
    source       TEXT NOT NULL,
    -- The user's id in that source, e.g. the Telegram sender id.
    external_id  TEXT NOT NULL,
    display_name TEXT,
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (source, external_id)
);

ALTER TABLE conversations ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users (id) ON DELETE SET NULL;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS source TEXT CHECK (source IN ('web', 'telegram', 'console'));

-- The bot lists one user's conversations and the web those of a source (or of none), most recently updated first.
-- The first also serves the foreign key when a user is deleted.
CREATE INDEX IF NOT EXISTS idx_conversations_user_id_updated_at
    ON conversations (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_source_updated_at
    ON conversations (source, updated_at DESC);
