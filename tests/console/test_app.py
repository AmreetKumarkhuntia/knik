"""Tests for how ConsoleApp runs the shared commands: on its one AI client, printed after the assistant symbol."""

from unittest.mock import MagicMock

import pytest

from console import app as app_mod
from console.app import ConsoleApp
from console.config import ConsoleConfig
from console.tools.agent_cmd import agent_command
from lib.core.config import Config
from lib.services.ai_client.factory import build_client
from lib.services.ai_client.settings import ClientSettings
from tests.lib.commands import fakes


@pytest.fixture
def app(monkeypatch, tmp_path):
    fakes.install(monkeypatch, fakes.FakeConversations())
    app = ConsoleApp(ConsoleConfig(settings_file=tmp_path / "settings.json"))
    app.ai_client = fakes.FakeClient()
    app._initialize_command_service()
    return app


def test_model_command_switches_the_apps_client(app, capsys):
    app._handle_user_input("/model gemini-2.5-pro")

    assert capsys.readouterr().out == "AI: Model switched to gemini-2.5-pro\n\n"
    assert app.ai_client.model == "gemini-2.5-pro"


def test_commands_follow_a_replaced_client(app, capsys):
    app.ai_client = fakes.FakeClient(provider="vertex", model="gemini-2.5-pro")

    app._handle_user_input("/status")

    assert "  Provider: vertex\n  Model:    gemini-2.5-pro\n" in capsys.readouterr().out


def test_without_a_client_a_command_reports_the_error(app, capsys):
    app.ai_client = None

    app._handle_user_input("/status")

    assert capsys.readouterr().out == "AI: Error executing command: AI client is not initialized\n\n"


def test_agent_shows_the_error_of_a_failed_call(app):
    client = build_client(ClientSettings(provider="mock"))

    def chat(**kwargs):
        raise RuntimeError("quota exceeded")

    client._provider.chat = chat
    app.ai_client = client

    assert agent_command(app, "hi") == "Chat error: quota exceeded"


def test_the_settings_file_layers_over_the_env_and_a_stray_key_only_warns(tmp_path, caplog):
    settings_file = tmp_path / "settings.json"
    settings_file.write_text('{"ai_model": "m2", "bogus": 1}')

    with caplog.at_level("WARNING", logger="lib.core.config"):
        app = ConsoleApp(ConsoleConfig(settings_file=settings_file))

    assert isinstance(app.config, ConsoleConfig)
    assert app.config.ai_model == "m2"
    assert Config.current() is app.config
    assert "unknown setting 'bogus'" in caplog.text


@pytest.mark.parametrize(
    ("content", "problem"),
    [
        (None, None),
        ("{not json", "Expecting"),
        ("[1, 2]", "expected a JSON object"),
        ("null", "expected a JSON object"),
    ],
)
def test_a_missing_or_unusable_settings_file_falls_back_to_the_env(tmp_path, monkeypatch, content, problem):
    printer = MagicMock()
    monkeypatch.setattr(app_mod, "printer", printer)
    settings_file = tmp_path / "settings.json"
    if content is not None:
        settings_file.write_text(content)

    app = ConsoleApp(ConsoleConfig(settings_file=settings_file))

    assert app.config.ai_model == ConsoleConfig().ai_model
    if problem is None:
        printer.warning.assert_not_called()
    else:
        assert problem in printer.warning.call_args.args[0]


def test_the_ai_client_is_built_from_the_layered_config(tmp_path, monkeypatch):
    built: list[ClientSettings] = []
    monkeypatch.setattr(app_mod, "build_client", lambda settings, tool_registry: built.append(settings))
    registry = MagicMock()
    registry.get_tools.return_value = []
    monkeypatch.setattr(app_mod, "create_tool_registry", lambda consent_gate: registry)
    (tmp_path / "settings.json").write_text('{"ai_model": "m2", "temperature": 0.3, "custom_api_key": "sk-1"}')
    app = ConsoleApp(ConsoleConfig(settings_file=tmp_path / "settings.json"))

    app._initialize_ai_client()

    assert built == [ClientSettings.from_config(app.config)]
    assert (built[0].model, built[0].temperature, built[0].api_key) == ("m2", 0.3, "sk-1")
