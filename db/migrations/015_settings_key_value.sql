-- Generic key/value settings: one row per Config field a user overrides, with the value as JSON so its
-- type survives. Replaces the fixed-column app_settings row; its values are not carried over.

CREATE TABLE IF NOT EXISTS settings (
    key        TEXT PRIMARY KEY,
    value      JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS app_settings;
