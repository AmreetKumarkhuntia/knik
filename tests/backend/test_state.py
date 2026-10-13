"""AppState: one client per conversation, built from the current settings; settings changes drop cached clients."""

import asyncio
import time
from unittest.mock import MagicMock

import pytest

from backend import state as state_module
from backend.models.admin import SettingsUpdate
from backend.settings_service import SettingsService
from backend.state import AppState
from lib.services.ai_client.factory import ClientSettings
from lib.tools.registry import ToolRegistry
from lib.workflows.scheduler import Scheduler


@pytest.fixture
def persisted(monkeypatch) -> dict:
    """SettingsDB/McpToolsDB without a database: writes are recorded, overrides start empty."""
    saved: dict = {"settings": [], "tools": {}}

    async def upsert(fields):
        saved["settings"].append(fields)

    async def set_enabled(tool_name, enabled):
        saved["tools"][tool_name] = enabled

    monkeypatch.setattr("backend.settings_service.SettingsDB.upsert", upsert)
    monkeypatch.setattr("backend.settings_service.McpToolsDB.set_enabled", set_enabled)
    return saved


@pytest.fixture
def app_state(config, persisted) -> AppState:
    settings = SettingsService(config)
    return AppState(config, settings, state_module.KokoroVoiceModel(voice="af_heart"), Scheduler())


def test_settings_start_from_the_env_config(config):
    settings = SettingsService(config).client_settings

    assert settings == ClientSettings(
        provider="mock",
        model="mock-model",
        system_instruction=str(config.system_instruction),
        project_id=config.ai_project_id or None,
        location=config.ai_location or None,
    )


@pytest.mark.asyncio
async def test_create_loads_the_settings_and_the_tts_model_at_startup(config, monkeypatch):
    loaded: list[SettingsService] = []

    async def load(self):
        loaded.append(self)

    monkeypatch.setattr(SettingsService, "load", load)

    state = await AppState.create(config)

    assert loaded == [state.settings]
    assert state.tts.loaded
    assert state.tts.voice == config.voice_name
    assert isinstance(state.scheduler, Scheduler)


@pytest.mark.asyncio
async def test_a_tts_model_that_fails_to_load_is_kept_for_a_retry_on_first_use(config, monkeypatch):
    class BrokenTTS(state_module.KokoroVoiceModel):
        def load(self):
            raise OSError("no model files")

    async def load(self):
        return None

    monkeypatch.setattr(state_module, "KokoroVoiceModel", BrokenTTS)
    monkeypatch.setattr(SettingsService, "load", load)

    state = await AppState.create(config)

    assert isinstance(state.tts, BrokenTTS)


@pytest.mark.asyncio
async def test_clients_are_cached_per_conversation(app_state):
    first = await app_state.get_client("c1")

    assert await app_state.get_client("c1") is first
    assert await app_state.get_client(None) is not first
    assert first.provider_name == "mock"
    assert isinstance(first.tool_registry, ToolRegistry)


@pytest.mark.asyncio
async def test_every_client_gets_its_own_tool_registry(app_state):
    first = await app_state.get_client("c1")
    second = await app_state.get_client("c2")

    assert first.tool_registry is not second.tool_registry


@pytest.mark.asyncio
async def test_changing_client_settings_drops_cached_clients(app_state, persisted):
    first = await app_state.get_client("c1")

    await app_state.update_settings(SettingsUpdate(temperature=0.2, max_tokens=512))

    assert persisted["settings"] == [{"temperature": 0.2, "max_tokens": 512}]
    assert (app_state.settings.client_settings.temperature, app_state.settings.client_settings.max_tokens) == (0.2, 512)
    assert await app_state.get_client("c1") is not first


@pytest.mark.asyncio
async def test_settings_that_do_not_change_clients_keep_them(app_state, persisted):
    first = await app_state.get_client("c1")

    await app_state.update_settings(SettingsUpdate(display_name="Ada", model="mock-model", voice="am_adam"))

    assert persisted["settings"] == [{"model": "mock-model", "voice": "am_adam", "display_name": "Ada"}]
    assert await app_state.get_client("c1") is first
    assert app_state.tts.voice == "am_adam"
    assert app_state.settings.voice == "am_adam"


@pytest.mark.asyncio
async def test_a_failed_write_applies_nothing(app_state, monkeypatch):
    async def upsert(fields):
        raise RuntimeError("database down")

    monkeypatch.setattr("backend.settings_service.SettingsDB.upsert", upsert)
    first = await app_state.get_client("c1")
    before = app_state.settings.client_settings

    with pytest.raises(RuntimeError):
        await app_state.update_settings(SettingsUpdate(provider="custom", voice="am_adam"))

    assert app_state.settings.client_settings == before
    assert app_state.tts.voice == "af_heart"
    assert await app_state.get_client("c1") is first


@pytest.mark.asyncio
async def test_switching_a_tool_group_drops_cached_clients_only_when_tools_change(app_state, persisted):
    first = await app_state.get_client("c1")

    await app_state.set_tool_group_enabled("shell", True)
    assert await app_state.get_client("c1") is first

    await app_state.set_tool_group_enabled("shell", False)
    second = await app_state.get_client("c1")
    assert second is not first
    assert persisted["tools"] == {"shell": False}

    # A name that is not a tool group is stored, but changes no client.
    await app_state.set_tool_group_enabled("no-such-group", False)
    assert await app_state.get_client("c1") is second


class FakeClient:
    """A client whose tool cleanup is recorded."""

    def __init__(self, name: str) -> None:
        self.name = name
        self.tool_registry = MagicMock()

    @property
    def cleaned_up(self) -> bool:
        return self.tool_registry.cleanup_tools.called


@pytest.fixture
def fake_builds(app_state, monkeypatch) -> list[FakeClient]:
    """Makes AppState build FakeClients a, b, c... each taking a moment, as model discovery does."""
    built: list[FakeClient] = []

    def build_client():
        time.sleep(0.05)
        built.append(FakeClient("abcdefgh"[len(built)]))
        return built[-1]

    monkeypatch.setattr(app_state.settings, "build_client", build_client)
    return built


async def _settle(state: AppState) -> None:
    """Waits for the tool cleanups AppState runs in worker threads."""
    await asyncio.gather(*state._cleanups)


def test_removing_a_client_cleans_up_its_tools(app_state):
    doomed = FakeClient("doomed")
    app_state.clients.set("c1", doomed)  # type: ignore[arg-type]

    app_state.remove_client("c1")

    assert doomed.cleaned_up
    assert app_state.clients.get("c1") is None


@pytest.mark.asyncio
async def test_a_client_is_cleaned_up_only_after_the_request_holding_it_ends(app_state, fake_builds):
    async with app_state.client("c1") as held:
        app_state.remove_client("c1")
        await _settle(app_state)
        assert not held.cleaned_up

    await _settle(app_state)
    assert held.cleaned_up


@pytest.mark.asyncio
async def test_a_settings_change_cleans_up_idle_clients_and_spares_busy_ones(app_state, persisted, fake_builds):
    idle = await app_state.get_client("idle")
    async with app_state.client("busy") as busy:
        await app_state.update_settings(SettingsUpdate(temperature=0.2))
        await _settle(app_state)
        assert idle.cleaned_up
        assert not busy.cleaned_up

    await _settle(app_state)
    assert busy.cleaned_up
    assert len(app_state.clients) == 0


@pytest.mark.asyncio
async def test_concurrent_first_requests_for_a_conversation_share_one_client(app_state, fake_builds):
    first, second = await asyncio.gather(app_state.get_client("c1"), app_state.get_client("c1"))

    assert first is second
    await _settle(app_state)
    extra = next(client for client in fake_builds if client is not first)
    assert extra.cleaned_up
    assert not first.cleaned_up


@pytest.mark.asyncio
async def test_rekeying_keeps_a_client_another_request_already_cached(app_state, fake_builds):
    # A second tab writes to the new conversation before the first reply has finished.
    async with app_state.client(None) as new_chat, app_state.client("conv-y") as second_tab:
        app_state.set_client("conv-y", new_chat)
        assert app_state.clients.get("conv-y") is second_tab

    await _settle(app_state)
    assert new_chat.cleaned_up
    assert not second_tab.cleaned_up


@pytest.mark.asyncio
async def test_a_client_built_before_a_tool_switch_is_not_cached(app_state, persisted, fake_builds):
    async with app_state.client(None) as stale:
        await app_state.set_tool_group_enabled("shell", False)
        app_state.set_client("conv-1", stale)
        assert app_state.clients.get("conv-1") is None

    await _settle(app_state)
    assert stale.cleaned_up
    assert (await app_state.get_client("conv-1")) is not stale


@pytest.mark.asyncio
async def test_close_cleans_up_every_client(app_state, fake_builds, monkeypatch):
    cleaned_registries: list = []
    monkeypatch.setattr(state_module, "cleanup_all_tools", lambda: cleaned_registries.append("all"))
    cached = await app_state.get_client("c1")

    await app_state.close()

    assert cached.cleaned_up
    assert cleaned_registries == ["all"]
