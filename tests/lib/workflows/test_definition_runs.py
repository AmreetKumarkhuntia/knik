"""Definitions in every spelling run on the engine: the web builder's, the AI tool templates and older stored ones."""

import dataclasses
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest

from lib.core.config import Config
from lib.services.ai_client.factory import ClientSettings
from lib.services.db import ExecutionDB, PostgresDB, Workflow, WorkflowDB
from lib.tools.workflow_tool import WorkflowTool
from lib.workflows import engine as engine_mod
from lib.workflows import workflow_service
from lib.workflows.engine import WorkflowEngine
from lib.workflows.functions import WORKFLOW_FUNCTIONS
from lib.workflows.scheduler import Scheduler
from tests.db_support import requires_db
from tests.lib.workflows.support import (
    FRONTEND_DEFINITION,
    LEGACY_DEFINITION,
    RecordingAIFactory,
    answer_http_locally,
)


pytestmark = pytest.mark.asyncio


@pytest.fixture
def executions(monkeypatch):
    executions = SimpleNamespace(
        create_execution=AsyncMock(return_value=1),
        log_node_execution=AsyncMock(),
        complete_execution=AsyncMock(),
    )
    monkeypatch.setattr(engine_mod, "ExecutionDB", executions)
    return executions


def _assert_frontend_run(outputs: dict, factory: RecordingAIFactory) -> None:
    assert (outputs["start"], outputs["end"]) == ({}, {})
    assert outputs["shout"] == {"status": "success", "output": "TIDES"}
    assert outputs["check"] == {"result": True}
    assert "skipped" not in outputs
    # 'overwrite' flattens: shout is connected to the merge after summarize, so its output wins.
    assert (outputs["merge"]["topic"], outputs["merge"]["output"]) == ("tides", "TIDES")

    [(settings, use_tools)] = factory.calls
    expected = dataclasses.replace(
        ClientSettings.from_config(Config.current()),
        provider="mock",
        model="configured-model",
        temperature=0.2,
        system_instruction=None,
    )
    assert settings == expected
    assert use_tools is False
    chat_kwargs = factory.client.chat.call_args.kwargs
    assert chat_kwargs["prompt"].startswith("Summarise tides")
    assert chat_kwargs["temperature"] == 0.2


async def test_a_frontend_definition_runs_with_its_markers_as_steps(executions):
    factory = RecordingAIFactory()
    workflow = Workflow(id="w1", name="Builder", definition=FRONTEND_DEFINITION)

    outputs = await WorkflowEngine(factory).execute_workflow(workflow, {"topic": "tides"})

    _assert_frontend_run(outputs, factory)
    steps = {call.kwargs["node_id"]: call.kwargs["node_type"] for call in executions.log_node_execution.await_args_list}
    assert steps == {
        "start": "StartNode",
        "shout": "FunctionExecutionNode",
        "check": "ConditionalBranchNode",
        "summarize": "AIExecutionNode",
        "merge": "FlowMergeNode",
        "end": "EndNode",
    }


async def test_an_older_definition_still_runs(executions):
    workflow = Workflow(id="w1", name="Old", definition=LEGACY_DEFINITION)

    outputs = await WorkflowEngine().execute_workflow(workflow, {"topic": "tides"})

    assert outputs["shout"] == {"status": "success", "output": "TIDES"}
    assert set(outputs["merge"]["merged_inputs"]) == {"input", "now", "shout"}


def _templates() -> dict[str, dict]:
    templates = WorkflowTool._get_workflow_templates()["templates"]
    return {
        name: template.get("example_definition") or template["example_workflow_creation"]["definition"]
        for name, template in templates.items()
    }


@pytest.mark.parametrize("name", sorted(_templates()))
async def test_every_workflow_template_runs(name, executions, monkeypatch):
    answer_http_locally(monkeypatch)

    async def instant_sleep(seconds: float) -> dict:
        return {"slept": seconds}

    monkeypatch.setitem(WORKFLOW_FUNCTIONS, "sleep", instant_sleep)
    definition = _templates()[name]

    outputs = await WorkflowEngine(RecordingAIFactory()).execute_workflow(
        Workflow(id=name, name=name, definition=definition), {"status": "success", "detail": "ok", "data": "x"}
    )

    assert outputs
    assert set(outputs) <= set(definition["nodes"])
    assert executions.complete_execution.await_args.kwargs["status"] == "success"


@requires_db
async def test_a_frontend_definition_saved_through_the_service_runs(db):
    created = await workflow_service.create_workflow("Builder", FRONTEND_DEFINITION)
    factory = RecordingAIFactory()

    outputs = await Scheduler(ai_client_factory=factory).run(created["workflow_id"], {"topic": "tides"})

    _assert_frontend_run(outputs, factory)
    [execution] = await ExecutionDB.get_execution_history(created["workflow_id"])
    assert execution.status == "success"
    steps = await ExecutionDB.get_node_executions(execution.id)
    assert {step.node_id: step.node_type for step in steps if step.node_id in ("start", "end")} == {
        "start": "StartNode",
        "end": "EndNode",
    }


@requires_db
async def test_an_older_stored_definition_runs_through_the_service(db):
    await WorkflowDB.create_workflow(Workflow(id="old", name="Old", definition=LEGACY_DEFINITION))

    outputs = await Scheduler().run("old", {"topic": "tides"})

    assert outputs["shout"] == {"status": "success", "output": "TIDES"}
    assert await PostgresDB.fetch_val("SELECT status FROM executions WHERE workflow_id = 'old'") == "success"
