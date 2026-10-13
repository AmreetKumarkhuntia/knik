"""Tests for how ConsoleApp runs the shared commands: on its one AI client, printed after the assistant symbol."""

import pytest

from console.app import ConsoleApp
from console.config import ConsoleConfig
from tests.lib.commands import fakes


@pytest.fixture
def app(monkeypatch):
    fakes.install(monkeypatch, fakes.FakeConversations())
    app = ConsoleApp(ConsoleConfig())
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
