"""SettingsService: env config, then persisted settings, then admin updates decide how new clients are built."""

import dataclasses

import pytest

from backend.models.admin import SettingsUpdate
from backend.settings_service import SettingsService
from lib.services.db import DatabaseUnavailable
from lib.services.db.models import AppSettings
from lib.services.db.repositories.settings import McpToolsDB, SettingsDB
from lib.tools.browser_tool import BROWSER_DEFINITIONS
from lib.tools.shell_tool import ShellTool
from tests.db_support import requires_db


SHELL_TOOLS = {definition["name"] for definition in ShellTool().get_definitions()}
BROWSER_TOOLS = {definition["name"] for definition in BROWSER_DEFINITIONS}


@pytest.fixture
def upserts(monkeypatch) -> list[dict]:
    written: list[dict] = []

    async def upsert(fields):
        written.append(fields)

    monkeypatch.setattr(SettingsDB, "upsert", upsert)
    return written


@pytest.fixture
def database_down(monkeypatch) -> None:
    async def unavailable(*_args, **_kwargs):
        raise DatabaseUnavailable("PostgreSQL is not reachable")

    monkeypatch.setattr(SettingsDB, "get", unavailable)
    monkeypatch.setattr(McpToolsDB, "get_overrides", unavailable)


@pytest.mark.asyncio
async def test_update_keeps_unset_values_and_clears_empty_ones(config, upserts):
    service = SettingsService(config)
    service.client_settings = dataclasses.replace(
        service.client_settings, api_base="http://a", api_key="k", temperature=0.5, max_tokens=100
    )

    await service.update(SettingsUpdate(provider="", model="m2", api_key="", temperature=0.0, max_tokens=0))

    assert upserts == [{"provider": "", "model": "m2", "api_key": "", "temperature": 0.0, "max_tokens": 0}]
    settings = service.client_settings
    assert (settings.provider, settings.model, settings.api_base, settings.api_key) == ("mock", "m2", "http://a", None)
    assert (settings.temperature, settings.max_tokens) == (0.0, None)


@pytest.mark.asyncio
async def test_update_applies_temperature_max_tokens_and_endpoint(config, upserts):
    service = SettingsService(config)

    await service.update(
        SettingsUpdate(
            provider="custom", api_base="http://llm.local/v1", api_key="sk-1", temperature=0.3, max_tokens=64
        )
    )

    settings = service.client_settings
    assert (settings.provider, settings.api_base, settings.api_key) == ("custom", "http://llm.local/v1", "sk-1")
    assert (settings.temperature, settings.max_tokens) == (0.3, 64)


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
async def test_without_a_database_the_env_defaults_stay_in_effect(config, database_down):
    service = SettingsService(config)

    await service.load()

    assert service.client_settings == SettingsService(config).client_settings
    assert service.disabled_tool_groups == frozenset()


@pytest.mark.asyncio
async def test_view_falls_back_to_the_values_in_effect_without_a_database(config, database_down):
    service = SettingsService(config)
    service.client_settings = dataclasses.replace(service.client_settings, provider="custom", model="m9")
    service.voice = "am_adam"
    service.disabled_tool_groups = frozenset({"shell"})

    view = await service.view()

    assert (view["provider"], view["model"], view["voice"]) == ("custom", "m9", "am_adam")
    assert (view["temperature"], view["max_tokens"]) == (config.temperature, config.max_tokens)

    # Temperature and max_tokens in effect (persisted at startup, or set since) win over the env too.
    service.client_settings = dataclasses.replace(service.client_settings, temperature=0.2, max_tokens=300)
    view = await service.view()
    assert (view["temperature"], view["max_tokens"]) == (0.2, 300)
    assert (view["stream_responses"], view["send_telemetry"], view["initialized"]) == (True, False, True)
    groups = {group["name"]: group["enabled"] for group in await service.tool_groups()}
    assert groups["shell"] is False
    assert all(enabled for name, enabled in groups.items() if name != "shell")


@pytest.mark.asyncio
async def test_view_prefers_persisted_preferences(config, monkeypatch):
    async def get():
        return AppSettings(provider="zai", model=None, voice="am_leo", temperature=0.0, max_tokens=None)

    monkeypatch.setattr(SettingsDB, "get", get)
    service = SettingsService(config)

    view = await service.view()

    assert (view["provider"], view["model"], view["voice"]) == ("zai", "mock-model", "am_leo")
    assert (view["temperature"], view["max_tokens"]) == (0.0, config.max_tokens)


@requires_db
@pytest.mark.asyncio
async def test_load_applies_the_persisted_settings_and_tool_overrides(config, db):
    await SettingsDB.upsert(
        {
            "provider": "custom",
            "model": "my-model",
            "voice": "am_adam",
            "temperature": 0.25,
            "max_tokens": 2048,
            "api_base": "http://llm.local/v1",
            "api_key": "sk-test",
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
    assert service.voice == "am_adam"
    assert service.disabled_tool_groups == frozenset({"shell"})
    assert service.disabled_tools == SHELL_TOOLS
