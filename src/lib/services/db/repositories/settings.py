"""Web-app settings: the single settings row, API keys and tool-group overrides."""

import hashlib
import secrets
import uuid
from typing import Any

from ..connection import PostgresDB
from ..models import ApiKey, AppSettings, CreatedApiKey, McpToolState
from .base import json_param, to_model, to_models


_SETTINGS_ID = "singleton"

# The only columns upsert may write; it builds its SQL from the field names, so this also guards it.
SETTINGS_COLUMNS = frozenset(
    {
        "provider",
        "model",
        "voice",
        "temperature",
        "max_tokens",
        "stream_responses",
        "send_telemetry",
        "display_name",
        "username",
        "api_base",
        "api_key",
    }
)


class SettingsDB:
    @staticmethod
    async def get() -> AppSettings | None:
        """The persisted settings, or None when nothing has been saved yet."""
        row = await PostgresDB.fetch_one("SELECT * FROM app_settings WHERE id = %s", (_SETTINGS_ID,))
        return to_model(AppSettings.from_row, row)

    @staticmethod
    async def upsert(fields: dict[str, Any]) -> None:
        """Save the given columns; unknown names and None values are ignored."""
        data = {k: v for k, v in fields.items() if k in SETTINGS_COLUMNS and v is not None}
        if not data:
            return
        cols = list(data)
        insert_cols = ", ".join(["id", *cols, "updated_at"])
        placeholders = ", ".join(["%s"] * (len(cols) + 1) + ["CURRENT_TIMESTAMP"])
        updates = ", ".join(f"{c} = EXCLUDED.{c}" for c in cols)
        query = f"""
            INSERT INTO app_settings ({insert_cols})
            VALUES ({placeholders})
            ON CONFLICT (id) DO UPDATE
            SET {updates}, updated_at = CURRENT_TIMESTAMP
        """
        await PostgresDB.execute(query, (_SETTINGS_ID, *[data[c] for c in cols]))


class ApiKeyDB:
    @staticmethod
    async def list_keys() -> list[ApiKey]:
        """Every key's metadata (never the hash), newest first."""
        rows = await PostgresDB.fetch_all(
            "SELECT id, label, key_prefix, scopes, created_at, last_used_at FROM api_keys ORDER BY created_at DESC"
        )
        return to_models(ApiKey.from_row, rows)

    @staticmethod
    async def create(label: str, scopes: list[str] | None = None) -> CreatedApiKey:
        """Create a key; only its SHA-256 hash is stored, so the returned secret cannot be recovered later."""
        full_key = f"knik_live_{secrets.token_hex(24)}"
        row = await PostgresDB.fetch_one(
            """
            INSERT INTO api_keys (id, label, key_prefix, key_hash, scopes)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id, label, key_prefix, scopes, created_at, last_used_at
            """,
            (
                str(uuid.uuid4()),
                label,
                full_key[:16],
                hashlib.sha256(full_key.encode()).hexdigest(),
                json_param(scopes or []),
            ),
        )
        return CreatedApiKey(api_key=ApiKey.from_row(row), key=full_key)

    @staticmethod
    async def delete(key_id: str) -> bool:
        return await PostgresDB.execute("DELETE FROM api_keys WHERE id = %s", (key_id,)) > 0


class McpToolsDB:
    @staticmethod
    async def list_states() -> list[McpToolState]:
        rows = await PostgresDB.fetch_all("SELECT tool_name, enabled, updated_at FROM mcp_tools_state")
        return to_models(McpToolState.from_row, rows)

    @staticmethod
    async def get_overrides() -> dict[str, bool]:
        """{tool_name: enabled} for the tool groups that have an explicit override."""
        return {state.tool_name: state.enabled for state in await McpToolsDB.list_states()}

    @staticmethod
    async def set_enabled(tool_name: str, enabled: bool) -> McpToolState:
        row = await PostgresDB.fetch_one(
            """
            INSERT INTO mcp_tools_state (tool_name, enabled, updated_at)
            VALUES (%s, %s, CURRENT_TIMESTAMP)
            ON CONFLICT (tool_name) DO UPDATE
            SET enabled = EXCLUDED.enabled, updated_at = CURRENT_TIMESTAMP
            RETURNING tool_name, enabled, updated_at
            """,
            (tool_name, enabled),
        )
        return McpToolState.from_row(row)
