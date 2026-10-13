"""Web chats and tools that need consent: refused by default, since nobody can be asked; run unasked under allow.

A real LangChain agent drives the tool call, with a scripted chat model in place of an AI provider, so the tests
see exactly what the model is given back.
"""

import dataclasses

import pytest
from fastapi.testclient import TestClient
from langchain.agents import create_agent
from langchain_core.language_models.fake_chat_models import GenericFakeChatModel
from langchain_core.messages import AIMessage, BaseMessage, ToolMessage
from pydantic import Field

from backend import main
from backend.main import app
from backend.settings_service import SettingsService
from lib.tools.shell_tool import ShellTool


class ScriptedModel(GenericFakeChatModel):
    """Answers with its scripted messages in turn and keeps the messages each call was given."""

    inputs: list[list[BaseMessage]] = Field(default_factory=list)

    def bind_tools(self, tools, **kwargs):  # type: ignore[override]
        # The script already holds the tool calls.
        return self

    def _generate(self, messages, stop=None, run_manager=None, **kwargs):
        self.inputs.append(list(messages))
        return super()._generate(messages, stop=stop, run_manager=run_manager, **kwargs)


@pytest.fixture
def shell_commands(monkeypatch) -> list[str]:
    """The commands the shell tool ran; its implementation is replaced, so nothing reaches a real shell."""
    ran: list[str] = []

    def run_shell_command(command: str, timeout: int = 10) -> str:
        ran.append(command)
        return f"ran {command}"

    monkeypatch.setattr(ShellTool, "_run_shell_command", staticmethod(run_shell_command))
    return ran


def _shell_result_the_model_sees(service: SettingsService) -> BaseMessage:
    """Has a web chat client's tools run `ls` for the model; returns what its next call is given."""
    model = ScriptedModel(
        messages=iter(
            [
                AIMessage(
                    content="", tool_calls=[{"name": "run_shell_command", "args": {"command": "ls"}, "id": "call_1"}]
                ),
                AIMessage(content="Done."),
            ]
        )
    )
    tools = service.build_client().tool_registry.create_langchain_tools()

    create_agent(model=model, tools=tools).invoke({"messages": [{"role": "user", "content": "list my files"}]})

    assert len(model.inputs) == 2
    return model.inputs[1][-1]


def test_a_web_chat_refuses_a_tool_that_needs_consent_and_tells_the_model(config, shell_commands):
    result = _shell_result_the_model_sees(SettingsService(config))

    assert isinstance(result, ToolMessage)
    assert result.tool_call_id == "call_1"
    assert "Permission denied for run_shell_command" in result.content
    assert shell_commands == []


def test_allow_runs_tools_that_need_consent_without_asking(config, shell_commands):
    result = _shell_result_the_model_sees(SettingsService(dataclasses.replace(config, tool_consent="allow")))

    assert isinstance(result, ToolMessage)
    assert result.content == "ran ls"
    assert shell_commands == ["ls"]


def test_every_tool_that_needs_consent_is_refused_and_the_others_still_run(config):
    registry = SettingsService(config).build_client().tool_registry
    needs_consent = {name for tool in registry.get_tool_instances() for name in type(tool).consent_required_for}

    assert needs_consent >= {"run_shell_command", "write_file", "browser_navigate", "add_cron_schedule"}
    for name in needs_consent:
        assert registry.execute_tool(name) == {"error": f"Permission denied for {name}"}
    assert registry.execute_tool("word_count", text="two words").startswith("Words: 2,")


def test_allow_is_announced_as_a_warning_at_startup(offline_database, config, monkeypatch):
    warnings: list[str] = []
    monkeypatch.setattr(main.printer, "warning", warnings.append)

    with TestClient(app):
        pass
    assert not [warning for warning in warnings if "KNIK_WEB_TOOL_CONSENT" in warning]

    monkeypatch.setattr(main, "config", dataclasses.replace(config, tool_consent="allow"))
    with TestClient(app):
        pass
    assert [warning for warning in warnings if "KNIK_WEB_TOOL_CONSENT=allow" in warning]
