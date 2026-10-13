"""The Scheduler facade: run a workflow by id, and start/stop the schedule loop. CRUD lives in the services."""

import asyncio
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest

from lib.workflows import engine as engine_mod
from lib.workflows import loop as loop_mod
from lib.workflows import workflow_service
from lib.workflows.errors import NotFoundError
from lib.workflows.scheduler import Scheduler


pytestmark = pytest.mark.asyncio

WORKFLOW = SimpleNamespace(
    id="w1",
    definition={"nodes": {"double": {"type": "FunctionExecutionNode", "code": "output = 21 * 2"}}, "connections": []},
)


@pytest.fixture(autouse=True)
def no_database(monkeypatch):
    monkeypatch.setattr(
        engine_mod,
        "ExecutionDB",
        SimpleNamespace(
            create_execution=AsyncMock(return_value="exec-1"),
            log_node_execution=AsyncMock(),
            complete_execution=AsyncMock(),
        ),
    )
    lookup = AsyncMock(side_effect=lambda workflow_id: WORKFLOW if workflow_id == "w1" else None)
    monkeypatch.setattr(workflow_service, "get_workflow", lookup)
    return lookup


async def test_run_executes_the_workflow_and_returns_its_outputs():
    assert await Scheduler().run("w1", {"x": 1}) == {"double": {"status": "success", "output": 42}}


async def test_run_of_an_unknown_workflow_raises_not_found():
    with pytest.raises(NotFoundError) as caught:
        await Scheduler().run("missing")

    # Still a ValueError with the old message, so `except ValueError` callers keep their output.
    assert isinstance(caught.value, ValueError)
    assert str(caught.value) == "Workflow missing not found."
    assert caught.value.to_dict() == {"error": "Workflow missing not found.", "workflow_id": "missing"}
    engine_mod.ExecutionDB.create_execution.assert_not_awaited()


async def test_start_and_stop_drive_the_polling_loop_and_repeat_safely(monkeypatch):
    polling = asyncio.Event()

    async def poll_loop(self):
        polling.set()
        await asyncio.Event().wait()

    monkeypatch.setattr(loop_mod.CronScheduler, "_poll_loop", poll_loop)
    scheduler = Scheduler()

    scheduler.start()
    task = scheduler.cron_scheduler._task
    scheduler.start()
    assert task is not None and scheduler.cron_scheduler._task is task
    await asyncio.wait_for(polling.wait(), timeout=5)

    scheduler.stop()
    scheduler.stop()
    with pytest.raises(asyncio.CancelledError):
        await task
