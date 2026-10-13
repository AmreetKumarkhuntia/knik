"""Tests for how the workflow engine builds AI clients: through an injected factory, or without tools."""

from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import pytest

from lib.services.ai_client.factory import ClientSettings
from lib.workflows import engine as engine_mod
from lib.workflows import nodes as nodes_mod
from lib.workflows.engine import WorkflowEngine
from lib.workflows.scheduler import Scheduler


pytestmark = pytest.mark.asyncio


def _workflow(**ai_node):
    node = {"type": "AIExecutionNode", "prompt": "Summarise {input.topic}", **ai_node}
    return SimpleNamespace(id="w1", definition={"nodes": {"ai": node}, "connections": []})


@pytest.fixture(autouse=True)
def no_database(monkeypatch):
    executions = SimpleNamespace(
        create_execution=AsyncMock(return_value="exec-1"),
        log_node_execution=AsyncMock(),
        complete_execution=AsyncMock(),
    )
    monkeypatch.setattr(engine_mod, "ExecutionDB", executions)
    return executions


class RecordingFactory:
    def __init__(self) -> None:
        self.calls: list[tuple[ClientSettings, bool]] = []
        self.client = MagicMock()
        self.client.chat.return_value = "summary"
        self.client.last_usage = {"input_tokens": 3, "output_tokens": 2, "total_tokens": 5}

    def __call__(self, settings: ClientSettings, use_tools: bool):
        self.calls.append((settings, use_tools))
        return self.client


async def test_ai_node_builds_its_client_with_the_injected_factory():
    factory = RecordingFactory()

    outputs = await WorkflowEngine(ai_client_factory=factory).execute_workflow(
        _workflow(provider="zai", model="glm-5"), {"topic": "tides"}
    )

    [(settings, use_tools)] = factory.calls
    assert settings == ClientSettings(provider="zai", model="glm-5", temperature=0.7)
    assert use_tools is True
    factory.client.chat.assert_called_once_with(prompt="Summarise tides")
    assert outputs["ai"]["output"] == "summary"
    assert outputs["ai"]["tokens"]["total_tokens"] == 5


async def test_ai_node_passes_use_tools_false_and_cleans_up_the_clients_tools():
    factory = RecordingFactory()

    await WorkflowEngine(ai_client_factory=factory).execute_workflow(_workflow(use_tools=False), {"topic": "x"})

    [(_settings, use_tools)] = factory.calls
    assert use_tools is False
    factory.client.tool_registry.cleanup_tools.assert_called_once_with()


async def test_tools_are_cleaned_up_even_when_the_chat_fails():
    factory = RecordingFactory()
    factory.client.chat.side_effect = RuntimeError("provider down")

    with pytest.raises(RuntimeError):
        await WorkflowEngine(ai_client_factory=factory).execute_workflow(_workflow(), {"topic": "x"})

    factory.client.tool_registry.cleanup_tools.assert_called_once_with()


async def test_without_a_factory_the_node_runs_without_tools(monkeypatch):
    built: list[tuple[ClientSettings, dict]] = []
    real_build_client = nodes_mod.build_client

    def recording_build_client(settings, **kwargs):
        built.append((settings, kwargs))
        return real_build_client(settings, **kwargs)

    monkeypatch.setattr(nodes_mod, "build_client", recording_build_client)

    outputs = await WorkflowEngine().execute_workflow(_workflow(provider="mock", model="m"), {"topic": "x"})

    assert built == [(ClientSettings(provider="mock", model="m", temperature=0.7), {})]
    assert outputs["ai"]["status"] == "success"
    assert outputs["ai"]["output"].startswith("Mock")


async def test_scheduler_builds_one_engine_with_the_factory_for_runs_and_the_loop():
    factory = RecordingFactory()

    scheduler = Scheduler(ai_client_factory=factory)

    assert scheduler.workflow_engine.ai_client_factory is factory
    assert scheduler.cron_scheduler.engine is scheduler.workflow_engine
