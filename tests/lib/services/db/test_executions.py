"""ExecutionDB against a real database."""

from datetime import UTC, datetime, timedelta

import psycopg
import pytest

from lib.services.db import DB_ERRORS, ExecutionDB, PostgresDB, Workflow, WorkflowDB
from tests.db_support import requires_db


pytestmark = [requires_db, pytest.mark.asyncio]


async def _workflows(*ids: str) -> None:
    for workflow_id in ids:
        await WorkflowDB.create_workflow(Workflow(id=workflow_id, name=workflow_id.upper(), definition={}))


async def _backdate(execution_id: int, days: int) -> None:
    await PostgresDB.execute(
        "UPDATE executions SET started_at = started_at - make_interval(days => %s) WHERE id = %s", (days, execution_id)
    )


async def test_execution_lifecycle_and_node_traces(db):
    await _workflows("w1")
    execution_id = await ExecutionDB.create_execution("w1", {"x": 1})
    assert isinstance(execution_id, int)

    await ExecutionDB.log_node_execution(execution_id, "n1", "function", "success", {"in": 1}, {"out": 2}, None, 5)
    await ExecutionDB.log_node_execution(execution_id, "n2", "branch", "failed", {}, None, "boom", 7)
    await ExecutionDB.complete_execution(execution_id, "failed", error_message="boom", duration_ms=12)

    [execution] = await ExecutionDB.get_execution_history("w1")
    assert (execution.status, execution.inputs, execution.outputs) == ("failed", {"x": 1}, {})
    assert (execution.error_message, execution.duration_ms) == ("boom", 12)
    assert execution.completed_at is not None

    nodes = await ExecutionDB.get_node_executions(execution_id)
    assert [(n.node_id, n.status, n.outputs, n.duration_ms) for n in nodes] == [
        ("n1", "success", {"out": 2}, 5),
        ("n2", "failed", {}, 7),
    ]

    detail, traces = await ExecutionDB.get_execution_detail(execution_id)
    assert detail is not None
    assert detail.id == execution_id
    assert [t.node_id for t in traces] == ["n1", "n2"]
    assert await ExecutionDB.get_execution_detail(999) == (None, [])


async def test_complete_execution_stores_outputs(db):
    await _workflows("w1")
    execution_id = await ExecutionDB.create_execution("w1", {})
    await ExecutionDB.complete_execution(execution_id, "success", outputs={"n1": {"result": [1, 2]}})
    [execution] = await ExecutionDB.get_execution_history()
    assert execution.outputs == {"n1": {"result": [1, 2]}}


async def test_repositories_raise_database_errors(db):
    with pytest.raises(psycopg.errors.ForeignKeyViolation) as raised:
        await ExecutionDB.create_execution("no-such-workflow", {})
    assert isinstance(raised.value, DB_ERRORS)


async def test_history_is_scoped_and_capped(db):
    await _workflows("w1", "w2")
    for _ in range(3):
        await ExecutionDB.create_execution("w1", {})
    await ExecutionDB.create_execution("w2", {})

    assert len(await ExecutionDB.get_execution_history()) == 4
    assert {e.workflow_id for e in await ExecutionDB.get_execution_history("w2")} == {"w2"}

    await PostgresDB.execute(
        "INSERT INTO executions (workflow_id, status, started_at) "
        "SELECT 'w1', 'success', CURRENT_TIMESTAMP FROM generate_series(1, 120)"
    )
    assert len(await ExecutionDB.get_execution_history()) == 100


async def test_counts_rates_and_durations(db):
    await _workflows("w1")
    ids = [await ExecutionDB.create_execution("w1", {}) for _ in range(4)]
    await ExecutionDB.complete_execution(ids[0], "success", duration_ms=100)
    await ExecutionDB.complete_execution(ids[1], "success", duration_ms=201)
    await ExecutionDB.complete_execution(ids[2], "failed", duration_ms=300)
    # ids[3] stays running; ids[0] moves out of the recent window.
    await _backdate(ids[0], 10)

    now = datetime.now(UTC)
    week = (now - timedelta(days=7), now + timedelta(minutes=1))

    assert await ExecutionDB.get_executions_count() == 4
    assert await ExecutionDB.get_executions_count(*week) == 3
    assert await ExecutionDB.get_active_executions_count() == 1

    assert await ExecutionDB.get_success_rate() == 50.0
    assert await ExecutionDB.get_success_rate(*week) == 33.33
    assert await ExecutionDB.get_success_rate(now - timedelta(days=30), now - timedelta(days=20)) == 0.0

    assert await ExecutionDB.get_average_duration() == 200.33
    assert await ExecutionDB.get_average_duration(*week) == 250.5
    assert await ExecutionDB.get_average_duration(now - timedelta(days=30), now - timedelta(days=20)) == 0


async def test_recent_executions_summary_is_raw_snake_case(db):
    await _workflows("w1")
    first = await ExecutionDB.create_execution("w1", {})
    second = await ExecutionDB.create_execution("w1", {})
    await ExecutionDB.complete_execution(second, "success", duration_ms=9)
    await _backdate(first, 1)

    rows = await ExecutionDB.get_recent_executions_summary(limit=10)
    assert [row["id"] for row in rows] == [second, first]
    assert set(rows[0]) == {"id", "workflow_id", "workflow_name", "status", "started_at", "duration_ms"}
    assert (rows[0]["workflow_name"], rows[0]["status"], rows[0]["duration_ms"]) == ("W1", "success", 9)
    assert len(await ExecutionDB.get_recent_executions_summary(limit=1)) == 1


async def test_executions_paginated(db):
    await _workflows("w1", "w2")
    for i in range(5):
        execution_id = await ExecutionDB.create_execution("w1", {})
        await ExecutionDB.complete_execution(execution_id, "success" if i % 2 == 0 else "failed")
    await ExecutionDB.create_execution("w2", {})

    page = await ExecutionDB.get_executions_paginated(page=1, page_size=4)
    assert list(page) == ["executions", "total", "page", "page_size", "total_pages"]
    assert (page["total"], page["page"], page["page_size"], page["total_pages"]) == (6, 1, 4, 2)
    assert len(page["executions"]) == 4
    assert set(page["executions"][0]) == {"id", "workflow_id", "workflow_name", "status", "started_at", "duration_ms"}

    second = await ExecutionDB.get_executions_paginated(page=2, page_size=4)
    assert len(second["executions"]) == 2

    by_workflow = await ExecutionDB.get_executions_paginated(workflow_id="w2")
    assert (by_workflow["total"], by_workflow["executions"][0]["status"]) == (1, "running")

    failed = await ExecutionDB.get_executions_paginated(workflow_id="w1", status="FAILED")
    assert failed["total"] == 2
    assert {row["status"] for row in failed["executions"]} == {"failed"}
    assert (await ExecutionDB.get_executions_paginated(status="all"))["total"] == 6

    empty = await ExecutionDB.get_executions_paginated(workflow_id="none")
    assert (empty["executions"], empty["total"], empty["total_pages"]) == ([], 0, 1)


async def test_recent_activity_is_raw_rows(db):
    await _workflows("w1")
    execution_id = await ExecutionDB.create_execution("w1", {})
    await ExecutionDB.complete_execution(execution_id, "success")
    old = await ExecutionDB.create_execution("w1", {})
    await _backdate(old, 3)

    rows = await ExecutionDB.get_recent_activity(limit=10, hours_back=24)
    assert {(row["activity_type"], row["id"]) for row in rows} == {("execution", execution_id), ("update", None)}
    for row in rows:
        assert set(row) == {"activity_type", "id", "workflow_id", "workflow_name", "status", "timestamp"}
        assert row["workflow_name"] == "W1"
        assert isinstance(row["timestamp"], datetime)
    update = next(row for row in rows if row["activity_type"] == "update")
    assert update["status"] == "active"

    assert len(await ExecutionDB.get_recent_activity(limit=1)) == 1
    assert len(await ExecutionDB.get_recent_activity(limit=10, hours_back=24 * 7)) == 3
