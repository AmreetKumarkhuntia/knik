"""SettingsDB, ApiKeyDB and McpToolsDB against a real database."""

import hashlib

import pytest

from lib.core.config import Config
from lib.services.db import ApiKeyDB, McpToolsDB, PostgresDB, SettingsDB
from tests.db_support import requires_db


pytestmark = [requires_db, pytest.mark.asyncio]


async def test_settings_start_empty_and_delete_reports_whether_a_row_went(db):
    assert await SettingsDB.get_all() == {}
    await SettingsDB.set_many({})
    assert await SettingsDB.get_all() == {}
    assert await SettingsDB.delete("ai_model") is False


async def test_set_many_merges_with_the_stored_keys(db):
    await SettingsDB.set_many({"ai_model": "m1", "temperature": 0.3})
    await SettingsDB.set_many({"ai_model": "m2", "voice_name": "af_bella"})

    assert await SettingsDB.get_all() == {"ai_model": "m2", "temperature": 0.3, "voice_name": "af_bella"}
    assert await SettingsDB.delete("voice_name") is True
    assert await SettingsDB.get_all() == {"ai_model": "m2", "temperature": 0.3}


async def test_every_setting_round_trips_with_its_type(db):
    values = {item["key"]: item["default"] for item in Config.schema()}
    values.update({"temperature": 0.3, "max_tokens": 5, "enable_voice_output": False, "custom_api_base": None})
    values["ai_model"] = "m"

    await SettingsDB.set_many(values)
    stored = await SettingsDB.get_all()

    assert stored == values
    assert {k: type(v) for k, v in stored.items()} == {k: type(v) for k, v in values.items()}
    layered = Config().with_overrides(stored)
    assert (layered.temperature, layered.max_tokens, layered.enable_voice_output) == (0.3, 5, False)
    assert (layered.custom_api_base, layered.ai_model) == (None, "m")


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
