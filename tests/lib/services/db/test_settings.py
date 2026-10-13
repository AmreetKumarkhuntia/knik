"""SettingsDB, ApiKeyDB and McpToolsDB against a real database."""

import hashlib

import pytest

from lib.services.db import ApiKeyDB, AppSettings, McpToolsDB, PostgresDB, SettingsDB
from lib.services.db.repositories.settings import SETTINGS_COLUMNS
from tests.db_support import requires_db


pytestmark = [requires_db, pytest.mark.asyncio]


async def test_settings_start_empty(db):
    assert await SettingsDB.get() is None
    await SettingsDB.upsert({"unknown": 1, "provider": None})
    assert await SettingsDB.get() is None


async def test_settings_upsert_whitelist_and_merge(db):
    await SettingsDB.upsert(
        {
            "provider": "custom",
            "model": "m1",
            "api_base": "http://localhost:1234/v1",
            "api_key": "sk-test",
            "temperature": 0.3,
            "max_tokens": 512,
            "stream_responses": False,
            "unknown_column": "ignored",
            "voice": None,
        }
    )
    settings = await SettingsDB.get()
    assert isinstance(settings, AppSettings)
    assert (settings.provider, settings.model, settings.temperature, settings.max_tokens) == ("custom", "m1", 0.3, 512)
    assert (settings.api_base, settings.api_key) == ("http://localhost:1234/v1", "sk-test")
    assert settings.stream_responses is False
    assert settings.send_telemetry is False
    assert settings.voice is None
    first_update = settings.updated_at
    assert first_update is not None

    await SettingsDB.upsert({"model": "m2", "voice": "af_bella"})
    settings = await SettingsDB.get()
    assert (settings.provider, settings.model, settings.voice) == ("custom", "m2", "af_bella")
    assert settings.api_key == "sk-test"
    assert settings.updated_at is not None
    assert settings.updated_at >= first_update


async def test_every_whitelisted_column_exists(db):
    columns = {
        row["column_name"]
        for row in await PostgresDB.fetch_all(
            "SELECT column_name FROM information_schema.columns WHERE table_name = 'app_settings'"
        )
    }
    assert {"api_base", "api_key"} <= SETTINGS_COLUMNS
    assert columns >= SETTINGS_COLUMNS


async def test_settings_to_dict_is_the_raw_row(db):
    await SettingsDB.upsert({"provider": "gemini", "display_name": "Amy"})
    raw = await PostgresDB.fetch_one("SELECT * FROM app_settings WHERE id = 'singleton'")
    settings = await SettingsDB.get()
    assert settings is not None
    assert settings.to_dict() == raw
    assert list(settings.to_dict()) == list(raw)


async def test_api_keys(db):
    assert await ApiKeyDB.list_keys() == []

    created = await ApiKeyDB.create("CI", ["read"])
    payload = created.to_dict()
    assert list(payload) == ["id", "label", "key_prefix", "scopes", "key"]
    assert payload["label"] == "CI"
    assert payload["scopes"] == ["read"]
    assert payload["key"].startswith("knik_live_")
    assert payload["key_prefix"] == payload["key"][:16]

    stored_hash = await PostgresDB.fetch_val("SELECT key_hash FROM api_keys WHERE id = %s", (payload["id"],))
    assert stored_hash == hashlib.sha256(payload["key"].encode()).hexdigest()

    second = await ApiKeyDB.create("No scopes")
    assert second.to_dict()["scopes"] == []

    listed = await ApiKeyDB.list_keys()
    assert [k.id for k in listed] == [second.api_key.id, payload["id"]]
    listed_payload = listed[1].to_dict()
    assert list(listed_payload) == ["id", "label", "key_prefix", "scopes", "created_at", "last_used_at"]
    assert listed_payload["key_prefix"] == payload["key_prefix"]
    assert isinstance(listed_payload["created_at"], str)
    assert listed_payload["last_used_at"] is None
    assert "key" not in listed_payload

    assert await ApiKeyDB.delete(payload["id"]) is True
    assert await ApiKeyDB.delete(payload["id"]) is False
    assert [k.id for k in await ApiKeyDB.list_keys()] == [second.api_key.id]


async def test_an_api_key_is_found_only_by_its_full_secret(db):
    created = await ApiKeyDB.create("CI")
    other = await ApiKeyDB.create("Other")
    key = created.key

    assert await ApiKeyDB.find_id(key) == created.api_key.id
    assert await ApiKeyDB.find_id(other.key) == other.api_key.id
    for wrong in (key[:-1] + ("1" if key.endswith("0") else "0"), key[:16], key + "0", "", "knik_live_"):
        assert await ApiKeyDB.find_id(wrong) is None

    await ApiKeyDB.delete(created.api_key.id)
    assert await ApiKeyDB.find_id(key) is None


async def test_marking_an_api_key_used_stamps_only_that_key(db):
    used = await ApiKeyDB.create("Used")
    idle = await ApiKeyDB.create("Idle")

    await ApiKeyDB.mark_used(used.api_key.id)
    await ApiKeyDB.mark_used("no-such-key")

    stamps = {key.id: (key.created_at, key.last_used_at) for key in await ApiKeyDB.list_keys()}
    created_at, last_used_at = stamps[used.api_key.id]
    assert last_used_at is not None and created_at is not None
    assert last_used_at >= created_at
    assert stamps[idle.api_key.id][1] is None


async def test_mcp_tool_overrides(db):
    assert await McpToolsDB.get_overrides() == {}
    assert await McpToolsDB.list_states() == []

    state = await McpToolsDB.set_enabled("shell", False)
    assert (state.tool_name, state.enabled) == ("shell", False)
    await McpToolsDB.set_enabled("browser", True)
    await McpToolsDB.set_enabled("shell", True)

    assert await McpToolsDB.get_overrides() == {"shell": True, "browser": True}
    assert {s.tool_name for s in await McpToolsDB.list_states()} == {"shell", "browser"}
