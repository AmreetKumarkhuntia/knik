-- Settings persistence for the web app: AI/voice defaults, UI toggles, profile,
-- API keys, and MCP tool enable/disable overrides.

-- Single-row store (id = 'singleton') for app-wide settings + profile.
CREATE TABLE IF NOT EXISTS app_settings (
    id               TEXT PRIMARY KEY DEFAULT 'singleton',
    provider         TEXT,
    model            TEXT,
    voice            TEXT,
    temperature      DOUBLE PRECISION,
    max_tokens       INTEGER,
    stream_responses BOOLEAN DEFAULT TRUE,
    send_telemetry   BOOLEAN DEFAULT FALSE,
    display_name     TEXT,
    username         TEXT,
    updated_at       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- API keys for calling the KNIK API from external apps. Only a hash is stored;
-- the full key is shown to the user exactly once at creation time.
CREATE TABLE IF NOT EXISTS api_keys (
    id           TEXT PRIMARY KEY,
    label        TEXT NOT NULL,
    key_prefix   TEXT NOT NULL,
    key_hash     TEXT NOT NULL,
    scopes       JSONB DEFAULT '[]'::jsonb,
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP WITH TIME ZONE
);

-- Enable/disable overrides for the built-in MCP tool groups. Absence = enabled.
CREATE TABLE IF NOT EXISTS mcp_tools_state (
    tool_name  TEXT PRIMARY KEY,
    enabled    BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
