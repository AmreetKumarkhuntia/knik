"""WorkflowDB and ScheduleDB against a real database."""

from datetime import UTC, datetime, timedelta

import pytest

from lib.services.db import ExecutionDB, PostgresDB, Schedule, ScheduleDB, Workflow, WorkflowDB
from tests.db_support import requires_db


pytestmark = [requires_db, pytest.mark.asyncio]

DEFINITION = {"nodes": {"a": {"type": "function"}}, "connections": []}


async def _workflow(workflow_id: str, name: str | None = None) -> Workflow:
    workflow = Workflow(id=workflow_id, name=name or workflow_id.title(), definition=DEFINITION, description="d")
    await WorkflowDB.create_workflow(workflow)
    return workflow


def _schedule(workflow_id: str, *, enabled: bool = True) -> Schedule:
    return Schedule(
        id=0,
        target_workflow_id=workflow_id,
        enabled=enabled,
        timezone="UTC",
        schedule_description="every 5 minutes",
        next_run_at=datetime(2026, 1, 1, tzinfo=UTC),
        recurrence_seconds=300,
    )


async def test_workflow_crud(db):
    await _workflow("w1", "Alpha")
    stored = await WorkflowDB.get_workflow("w1")
    assert stored is not None
    assert (stored.name, stored.description, stored.definition) == ("Alpha", "d", DEFINITION)
    assert stored.created_at is not None
    assert stored.updated_at is not None

    await WorkflowDB.create_workflow(Workflow(id="w1", name="Alpha 2", definition={"nodes": {}}, description=None))
    updated = await WorkflowDB.get_workflow("w1")
    assert updated is not None
    assert updated.updated_at is not None
    assert (updated.name, updated.description, updated.definition) == ("Alpha 2", None, {"nodes": {}})
    assert updated.updated_at >= stored.updated_at

    await _workflow("w2", "Beta")
    assert {w.id for w in await WorkflowDB.list_workflows()} == {"w1", "w2"}
    assert await WorkflowDB.get_total_workflows() == 2
    assert await WorkflowDB.get_workflow_name("w2") == "Beta"
    assert await WorkflowDB.get_workflow_name("missing") is None
    assert await WorkflowDB.get_workflows_list() == [{"id": "w1", "name": "Alpha 2"}, {"id": "w2", "name": "Beta"}]

    assert await WorkflowDB.delete_workflow("w1") is True
    assert await WorkflowDB.delete_workflow("w1") is False
    assert await WorkflowDB.get_workflow("w1") is None


async def test_recent_workflows_summary_is_raw_snake_case(db):
    await _workflow("idle")
    await _workflow("busy")
    for status in ("success", "failed"):
        execution_id = await ExecutionDB.create_execution("busy", {})
        await ExecutionDB.complete_execution(execution_id, status)

    rows = await WorkflowDB.get_recent_workflows_summary(limit=10)
    assert [row["id"] for row in rows] == ["busy", "idle"]
    busy, idle = rows
    assert set(busy) == {"id", "name", "last_executed_at", "total_executions", "status"}
    assert (busy["total_executions"], busy["status"]) == (2, "active")
    assert isinstance(busy["last_executed_at"], datetime)
    assert (idle["total_executions"], idle["status"], idle["last_executed_at"]) == (0, "inactive", None)
    assert len(await WorkflowDB.get_recent_workflows_summary(limit=1)) == 1


async def test_top_workflows(db):
    await _workflow("w1")
    await _workflow("w2")
    for status in ("success", "success", "failed"):
        execution_id = await ExecutionDB.create_execution("w1", {})
        await ExecutionDB.complete_execution(execution_id, status)

    rows = await WorkflowDB.get_top_workflows(limit=10)
    assert rows[0] == {"id": "w1", "name": "W1", "executions": 3, "success_rate": 66.67}
    assert rows[1] == {"id": "w2", "name": "W2", "executions": 0, "success_rate": 0.0}
    assert isinstance(rows[0]["success_rate"], float)

    now = datetime.now(UTC)
    in_range = await WorkflowDB.get_top_workflows(10, now - timedelta(hours=1), now + timedelta(hours=1))
    assert in_range[0]["executions"] == 3
    out_of_range = await WorkflowDB.get_top_workflows(10, now - timedelta(days=9), now - timedelta(days=8))
    assert [row["executions"] for row in out_of_range] == [0, 0]


async def test_schedule_crud(db):
    await _workflow("w1")
    schedule_id = await ScheduleDB.create_schedule(_schedule("w1"))
    assert isinstance(schedule_id, int)

    [stored] = await ScheduleDB.list_schedules()
    assert (stored.id, stored.target_workflow_id, stored.recurrence_seconds) == (schedule_id, "w1", 300)
    assert stored.last_executed_at is None

    next_run = datetime(2026, 2, 1, tzinfo=UTC)
    await ScheduleDB.claim_due_run(schedule_id, stored.next_run_at, next_run)
    [stored] = await ScheduleDB.list_schedules()
    assert stored.next_run_at == next_run
    assert stored.last_executed_at is not None

    toggled = await ScheduleDB.toggle_schedule(schedule_id, False)
    assert toggled is not None
    assert toggled.enabled is False
    assert await ScheduleDB.toggle_schedule(999, True) is None

    assert await ScheduleDB.delete_schedule(schedule_id) is True
    assert await ScheduleDB.delete_schedule(schedule_id) is False
    assert await ScheduleDB.list_schedules() == []


async def test_list_schedules_includes_disabled_unless_enabled_only(db):
    await _workflow("w1")
    enabled_id = await ScheduleDB.create_schedule(_schedule("w1"))
    disabled_id = await ScheduleDB.create_schedule(_schedule("w1", enabled=False))

    assert sorted(s.id for s in await ScheduleDB.list_schedules()) == [enabled_id, disabled_id]
    assert [s.id for s in await ScheduleDB.list_schedules(enabled_only=True)] == [enabled_id]


async def test_delete_schedules_by_workflow_returns_the_deleted_count(db):
    await _workflow("w1")
    await _workflow("w2")
    for _ in range(3):
        await ScheduleDB.create_schedule(_schedule("w1"))
    await ScheduleDB.create_schedule(_schedule("w2"))

    assert await ScheduleDB.delete_schedules_by_workflow("w1") == 3
    assert await ScheduleDB.delete_schedules_by_workflow("w1") == 0
    assert [s.target_workflow_id for s in await ScheduleDB.list_schedules()] == ["w2"]


async def test_deleting_a_workflow_cascades_to_its_executions(db):
    await _workflow("w1")
    execution_id = await ExecutionDB.create_execution("w1", {})
    await ExecutionDB.log_node_execution(execution_id, "a", "function", "success", {})

    await WorkflowDB.delete_workflow("w1")
    assert await PostgresDB.fetch_val("SELECT COUNT(*) FROM node_executions") == 0
    assert await ExecutionDB.get_execution_history() == []
