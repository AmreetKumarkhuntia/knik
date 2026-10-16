"""Web-app settings: the key/value settings table, API keys and tool-group overrides."""

import hashlib
import hmac
import secrets
import uuid
from typing import Any

from ..connection import PostgresDB
from ..models import ApiKey, CreatedApiKey, McpToolState
from .base import json_param, to_models


# How many leading characters of a key are stored in the clear, to list it by and to look it up by.
_KEY_PREFIX_LENGTH = 16


class SettingsDB:
    """The ``settings`` table: one row per overridden Config key, its value as JSON (so its type survives)."""

    @staticmethod
    async def get_all() -> dict[str, Any]:
        rows = await PostgresDB.fetch_all("SELECT key, value FROM settings")
        return {row["key"]: row["value"] for row in rows}

    @staticmethod
    async def set_many(values: dict[str, Any]) -> None:
        """Insert or replace every given key in one statement, so a failure writes nothing."""
        if not values:
            return
        rows = ", ".join(["(%s, %s, CURRENT_TIMESTAMP)"] * len(values))
        params = tuple(param for key, value in values.items() for param in (key, json_param(value)))
        await PostgresDB.execute(
            f"INSERT INTO settings (key, value, updated_at) VALUES {rows} "
            "ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP",
            params,
        )

    @staticmethod
    async def delete(key: str) -> bool:
        return await PostgresDB.execute("DELETE FROM settings WHERE key = %s", (key,)) > 0


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
                full_key[:_KEY_PREFIX_LENGTH],
                _hash_key(full_key),
                json_param(scopes or []),
            ),
        )
        return CreatedApiKey(api_key=ApiKey.from_row(row), key=full_key)

    @staticmethod
    async def find_id(key: str) -> str | None:
        """The id of the stored key with this secret, or None. Hashes are compared in constant time."""
        key_hash = _hash_key(key)
        rows = await PostgresDB.fetch_all(
            "SELECT id, key_hash FROM api_keys WHERE key_prefix = %s", (key[:_KEY_PREFIX_LENGTH],)
        )
        for row in rows:
            if hmac.compare_digest(row["key_hash"], key_hash):
                return row["id"]
        return None

    @staticmethod
    async def mark_used(key_id: str) -> None:
        await PostgresDB.execute("UPDATE api_keys SET last_used_at = CURRENT_TIMESTAMP WHERE id = %s", (key_id,))

    @staticmethod
    async def delete(key_id: str) -> bool:
        return await PostgresDB.execute("DELETE FROM api_keys WHERE id = %s", (key_id,)) > 0


def _hash_key(key: str) -> str:
    return hashlib.sha256(key.encode()).hexdigest()


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
