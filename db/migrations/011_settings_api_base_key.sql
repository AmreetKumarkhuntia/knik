-- Persist the custom provider endpoint and key chosen in the settings screen, which the backend
-- already reads back from app_settings as api_base / api_key.

ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS api_base TEXT;
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS api_key TEXT;
