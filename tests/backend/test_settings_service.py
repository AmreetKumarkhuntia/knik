"""SettingsService: the env config with the stored overrides layered on top decides how new clients are built."""

import pytest

from backend.settings_service import SECRET_MASK, SettingsService
from lib.core.config import Config
from lib.services.ai_client.factory import ClientSettings
from lib.services.ai_client.registry.provider_registry import ProviderRegistry
from lib.services.db import DatabaseUnavailable
from lib.services.db.repositories.settings import McpToolsDB, SettingsDB
from lib.tools.browser_tool import BROWSER_DEFINITIONS
from lib.tools.shell_tool import ShellTool
from tests.db_support import requires_db


SHELL_TOOLS = {definition["name"] for definition in ShellTool().get_definitions()}
BROWSER_TOOLS = {definition["name"] for definition in BROWSER_DEFINITIONS}


@pytest.fixture
def writes(monkeypatch) -> list[dict]:
    """What SettingsDB.set_many is asked to store, one dict per call."""
    written: list[dict] = []

    async def set_many(values):
        written.append(values)

    monkeypatch.setattr(SettingsDB, "set_many", set_many)
    return written


@pytest.fixture
def deletes(monkeypatch) -> list[str]:
    deleted: list[str] = []

    async def delete(key):
        deleted.append(key)
        return True

    monkeypatch.setattr(SettingsDB, "delete", delete)
    return deleted


@pytest.fixture
def database_down(monkeypatch) -> None:
    async def unavailable(*_args, **_kwargs):
        raise DatabaseUnavailable("PostgreSQL is not reachable")

    monkeypatch.setattr(SettingsDB, "get_all", unavailable)
    monkeypatch.setattr(McpToolsDB, "get_overrides", unavailable)


def _by_key(service: SettingsService) -> dict[str, dict]:
    return {item["key"]: item for item in service.view()["settings"]}


@pytest.mark.asyncio
async def test_update_persists_then_applies_and_installs_the_layered_config(config, writes):
    service = SettingsService(config)
    change = {"temperature": 0.3, "max_tokens": 64, "custom_api_base": "http://llm.local/v1", "custom_api_key": "sk-1"}

    await service.update(change)

    assert writes == [change]
    settings = service.client_settings
    assert (settings.temperature, settings.max_tokens) == (0.3, 64)
    assert (settings.api_base, settings.api_key) == ("http://llm.local/v1", "sk-1")
    assert Config.current() is service.config
    assert service.config.ai_provider == "mock"


@pytest.mark.asyncio
async def test_null_clears_an_optional_setting(config, writes):
    service = SettingsService(config)
    await service.update({"custom_api_key": "sk-1"})

    await service.update({"custom_api_key": None})

    assert writes[-1] == {"custom_api_key": None}
    assert service.client_settings.api_key is None


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "change",
    [
        {"db_host": "x"},
        {"temperature": "hot"},
        {"temperature": float("nan")},
        {"temperature": 2.5},
        {"max_tokens": True},
        {"max_tokens": 0},
        {"system_instruction": ""},
        {"voice_name": "nope"},
        {"ai_provider": "nope"},
    ],
)
async def test_an_invalid_setting_is_refused_before_anything_is_written(config, writes, change):
    service = SettingsService(config)

    with pytest.raises(ValueError):
        await service.update({"temperature": 0.1, **change})

    assert writes == []
    assert service.client_settings == ClientSettings.from_config(config)


@pytest.mark.asyncio
async def test_posting_the_mask_back_leaves_the_secret_alone(config, writes):
    service = SettingsService(config)
    await service.update({"custom_api_key": "sk-1"})

    await service.update({"custom_api_key": SECRET_MASK, "temperature": 0.4})

    assert writes[-1] == {"temperature": 0.4}
    assert service.client_settings.api_key == "sk-1"

    # Only a secret reads back as the mask, so on any other key it is an ordinary value.
    await service.update({"display_name": SECRET_MASK})

    assert writes[-1] == {"display_name": SECRET_MASK}


@pytest.mark.asyncio
async def test_a_new_custom_api_base_never_inherits_the_stored_key(config, writes):
    service = SettingsService(config)
    await service.update({"custom_api_base": "http://llm.local/v1", "custom_api_key": "sk-1"})

    await service.update({"custom_api_base": "http://elsewhere.example/v1"})

    assert writes[-1] == {"custom_api_base": "http://elsewhere.example/v1", "custom_api_key": None}
    assert (service.client_settings.api_base, service.client_settings.api_key) == ("http://elsewhere.example/v1", None)

    await service.update({"custom_api_base": "http://third.example/v1", "custom_api_key": "sk-3"})
    await service.update({"custom_api_base": "http://third.example/v1", "temperature": 0.5})

    assert writes[-1] == {"custom_api_base": "http://third.example/v1", "temperature": 0.5}
    assert service.client_settings.api_key == "sk-3"


@pytest.mark.asyncio
async def test_stored_rows_the_model_no_longer_accepts_are_dropped_and_can_be_deleted(config, deletes, monkeypatch):
    async def get_all():
        return {"bogus": 1, "temperature": "hot", "voice_name": "am_adam"}

    async def no_overrides():
        return {}

    monkeypatch.setattr(SettingsDB, "get_all", get_all)
    monkeypatch.setattr(McpToolsDB, "get_overrides", no_overrides)
    service = SettingsService(config)

    await service.load()

    items = _by_key(service)
    assert (items["voice_name"]["value"], items["voice_name"]["source"]) == ("am_adam", "db")
    assert (items["temperature"]["value"], items["temperature"]["source"]) == (config.temperature, "default")
    assert "bogus" not in service._overrides

    await service.reset("bogus")

    assert deletes == ["bogus"]
    assert service.config.voice_name == "am_adam"


def test_disabled_groups_leave_their_tools_out_of_new_clients(config):
    service = SettingsService(config)
    all_tools = {tool["name"] for tool in service.build_client().tool_registry.get_tools()}
    group_tools = all_tools & (SHELL_TOOLS | BROWSER_TOOLS)
    assert group_tools >= SHELL_TOOLS and group_tools & BROWSER_TOOLS

    service.disabled_tool_groups = frozenset({"shell", "browser", "no-such-group"})

    assert service.disabled_tools == SHELL_TOOLS | BROWSER_TOOLS
    tools = {tool["name"] for tool in service.build_client().tool_registry.get_tools()}
    assert tools == all_tools - group_tools


@pytest.mark.asyncio
async def test_without_a_database_the_env_values_stay_in_effect(config, database_down):
    service = SettingsService(config)

    await service.load()

    assert service.client_settings == ClientSettings.from_config(config)
    assert service.disabled_tool_groups == frozenset()

    # The tool-group list then shows the groups in effect.
    service.disabled_tool_groups = frozenset({"shell"})
    groups = {group["name"]: group["enabled"] for group in await service.tool_groups()}
    assert groups["shell"] is False
    assert all(enabled for name, enabled in groups.items() if name != "shell")


@pytest.mark.asyncio
async def test_view_describes_every_user_setting_with_its_value_and_source(config, writes, monkeypatch):
    monkeypatch.delenv("KNIK_HISTORY_CONTEXT_SIZE", raising=False)
    monkeypatch.setenv("KNIK_VOICE", config.voice_name)
    service = SettingsService(config)

    items = _by_key(service)

    assert set(items) == {item["key"] for item in Config.schema()}
    assert items["ai_provider"]["options"] == ProviderRegistry.list_providers()
    assert (items["ai_provider"]["value"], items["ai_model"]["value"]) == ("mock", "mock-model")
    assert (items["history_context_size"]["source"], items["voice_name"]["source"]) == ("default", "env")
    assert (items["custom_api_key"]["secret"], items["custom_api_key"]["value"]) == (True, "")
    assert (items["temperature"]["type"], items["temperature"]["group"]) == ("float", "AI")
    assert (items["temperature"]["minimum"], items["temperature"]["maximum"]) == (0, 2)
    assert (items["max_tokens"]["nullable"], items["ai_provider"]["nullable"]) == (True, False)

    await service.update({"custom_api_key": "sk-1", "temperature": 0.3})

    items = _by_key(service)
    assert (items["custom_api_key"]["value"], items["custom_api_key"]["source"]) == (SECRET_MASK, "db")
    assert (items["temperature"]["value"], items["temperature"]["source"]) == (0.3, "db")


@pytest.mark.asyncio
async def test_reset_forgets_one_stored_value(config, writes, deletes):
    service = SettingsService(config)
    await service.update({"temperature": 0.3, "voice_name": "am_adam"})

    await service.reset("temperature")

    assert deletes == ["temperature"]
    assert service.config.temperature == config.temperature
    assert service.client_settings.temperature == config.temperature
    assert service.config.voice_name == "am_adam"
    assert _by_key(service)["temperature"]["source"] != "db"


@requires_db
@pytest.mark.asyncio
async def test_load_applies_the_stored_settings_and_tool_overrides(config, db):
    await SettingsDB.set_many(
        {
            "ai_provider": "custom",
            "ai_model": "my-model",
            "voice_name": "am_adam",
            "temperature": 0.25,
            "max_tokens": 2048,
            "custom_api_base": "http://llm.local/v1",
            "custom_api_key": "sk-test",
        }
    )
    await McpToolsDB.set_enabled("shell", False)
    await McpToolsDB.set_enabled("browser", True)
    service = SettingsService(config)

    await service.load()

    settings = service.client_settings
    assert (settings.provider, settings.model, settings.api_base, settings.api_key) == (
        "custom",
        "my-model",
        "http://llm.local/v1",
        "sk-test",
    )
    assert (settings.temperature, settings.max_tokens) == (0.25, 2048)
    assert service.config.voice_name == "am_adam"
    assert Config.current() is service.config
    assert service.disabled_tool_groups == frozenset({"shell"})
    assert service.disabled_tools == SHELL_TOOLS
