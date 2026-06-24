"""Data access layer for web-app settings persistence.

Mirrors ``ConversationDB``: every method is DB-resilient and returns a safe
default (None, empty list/dict) instead of raising when the database is
unavailable, so the backend boots and serves even without Postgres.
"""

import hashlib
import json
import secrets
import uuid
from typing import Any

from lib.services.postgres.db import PostgresDB
from lib.utils import printer


_SETTINGS_ID = "singleton"

# Whitelist of columns the settings upsert may touch (guards the dynamic SQL).
_SETTINGS_COLUMNS = frozenset(
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
    }
)


class SettingsDB:
    """Single-row app settings (AI/voice defaults, UI toggles, profile)."""

    @staticmethod
    async def get() -> dict[str, Any] | None:
        """Return the persisted settings row as a dict, or None if unset/unavailable."""
        try:
            row = await PostgresDB.fetch_one("SELECT * FROM app_settings WHERE id = %s", (_SETTINGS_ID,))
            return dict(row) if row else None
        except Exception as e:
            printer.debug(f"DB unavailable for settings get: {e}")
            return None

    @staticmethod
    async def upsert(fields: dict[str, Any]) -> None:
        """Persist the provided settings columns (ignores unknown / None values)."""
        data = {k: v for k, v in fields.items() if k in _SETTINGS_COLUMNS and v is not None}
        if not data:
            return
        try:
            cols = list(data.keys())
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
        except Exception as e:
            printer.error(f"DB error for settings upsert: {e}")


def _serialize_api_key(row: dict[str, Any]) -> dict[str, Any]:
    scopes = row.get("scopes")
    if isinstance(scopes, str):
        scopes = json.loads(scopes)
    return {
        "id": row["id"],
        "label": row["label"],
        "key_prefix": row["key_prefix"],
        "scopes": scopes or [],
        "created_at": row["created_at"].isoformat() if row.get("created_at") else None,
        "last_used_at": row["last_used_at"].isoformat() if row.get("last_used_at") else None,
    }


class ApiKeyDB:
    """API keys for calling the KNIK API. Only hashes are stored."""

    @staticmethod
    async def list_keys() -> list[dict[str, Any]]:
        """List API keys (without secrets), most recent first."""
        try:
            rows = await PostgresDB.fetch_all(
                "SELECT id, label, key_prefix, scopes, created_at, last_used_at FROM api_keys ORDER BY created_at DESC"
            )
            return [_serialize_api_key(r) for r in rows]
        except Exception as e:
            printer.debug(f"DB unavailable for api_keys list: {e}")
            return []

    @staticmethod
    async def create(label: str, scopes: list[str] | None = None) -> dict[str, Any] | None:
        """Create a key; returns its metadata plus the full secret (shown once)."""
        try:
            key_id = str(uuid.uuid4())
            full_key = f"knik_live_{secrets.token_hex(24)}"
            key_prefix = full_key[:16]
            key_hash = hashlib.sha256(full_key.encode()).hexdigest()
            await PostgresDB.execute(
                "INSERT INTO api_keys (id, label, key_prefix, key_hash, scopes) VALUES (%s, %s, %s, %s, %s)",
                (key_id, label, key_prefix, key_hash, json.dumps(scopes or [])),
            )
            return {
                "id": key_id,
                "label": label,
                "key_prefix": key_prefix,
                "scopes": scopes or [],
                "key": full_key,
            }
        except Exception as e:
            printer.error(f"DB error for api_keys create: {e}")
            return None

    @staticmethod
    async def delete(key_id: str) -> None:
        """Revoke (delete) an API key."""
        try:
            await PostgresDB.execute("DELETE FROM api_keys WHERE id = %s", (key_id,))
        except Exception as e:
            printer.error(f"DB error for api_keys delete: {e}")


class McpToolsDB:
    """Enable/disable overrides for the built-in MCP tool groups."""

    @staticmethod
    async def get_overrides() -> dict[str, bool]:
        """Return {tool_name: enabled} for any tools with an explicit override."""
        try:
            rows = await PostgresDB.fetch_all("SELECT tool_name, enabled FROM mcp_tools_state")
            return {r["tool_name"]: r["enabled"] for r in rows}
        except Exception as e:
            printer.debug(f"DB unavailable for mcp_tools get: {e}")
            return {}

    @staticmethod
    async def set_enabled(tool_name: str, enabled: bool) -> None:
        """Persist an enable/disable override for a tool group."""
        try:
            await PostgresDB.execute(
                """
                INSERT INTO mcp_tools_state (tool_name, enabled, updated_at)
                VALUES (%s, %s, CURRENT_TIMESTAMP)
                ON CONFLICT (tool_name) DO UPDATE
                SET enabled = EXCLUDED.enabled, updated_at = CURRENT_TIMESTAMP
                """,
                (tool_name, enabled),
            )
        except Exception as e:
            printer.error(f"DB error for mcp_tools set: {e}")
