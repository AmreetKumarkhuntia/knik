"""workflow_service and schedule_service against a real database (validation paths need none)."""

import pytest

from lib.services.db import ExecutionDB, ScheduleDB
from lib.workflows import schedule_service, workflow_service
from lib.workflows.engine import WorkflowEngine
from tests.db_support import requires_db


pytestmark = pytest.mark.asyncio

DEFINITION = {
    "nodes": {
        "double": {"type": "FunctionExecutionNode", "code": "output = 21 * 2"},
    },
    "connections": [],
}


async def test_create_workflow_rejects_an_invalid_definition():
    result = await workflow_service.create_workflow("Bad", {"nodes": {}})
    assert result["error"] == "Invalid workflow definition: Definition must contain 'connections' key"


async def test_create_schedule_rejects_bad_input():
    assert await schedule_service.create_schedule("", "every 5 minutes") == {"error": "target_workflow_id is required"}
    assert await schedule_service.create_schedule("w", "") == {"error": "schedule_description is required"}
    result = await schedule_service.create_schedule("w", "whenever you like")
    assert result["error"].startswith("Invalid schedule description")
    assert "hint" in result


@requires_db
async def test_workflow_lifecycle(db):
    created = await workflow_service.create_workflow("Nightly", DEFINITION, description="d", workflow_id="w1")
    assert created == {"success": True, "workflow_id": "w1", "name": "Nightly", "description": "d"}

    updated = await workflow_service.update_workflow("w1", "Nightly v2", DEFINITION)
    assert updated == {"success": True, "workflow_id": "w1", "name": "Nightly v2", "description": "d"}
    assert (await workflow_service.update_workflow("missing", "x", DEFINITION))["error"] == "Workflow missing not found"

    workflow = await workflow_service.get_workflow("w1")
    assert workflow is not None
    assert (workflow.name, workflow.definition) == ("Nightly v2", DEFINITION)
    assert [w.id for w in await workflow_service.list_workflows()] == ["w1"]

    assert await WorkflowEngine().execute_workflow(workflow) == {"double": {"status": "success", "output": 42}}
    [execution] = await ExecutionDB.get_execution_history("w1")
    assert execution.status == "success"


@requires_db
async def test_schedules_are_listed_with_disabled_ones_unless_enabled_only(db):
    await workflow_service.create_workflow("Nightly", DEFINITION, workflow_id="w1")
    first = await schedule_service.create_schedule("w1", "every 5 minutes")
    second = await schedule_service.create_schedule("w1", "daily at 9am", timezone="Europe/Berlin")
    assert first["success"] and second["success"]
    assert first["recurrence_seconds"] == 300

    toggled = await schedule_service.toggle_schedule(second["schedule_id"], False)
    assert toggled is not None and toggled.enabled is False
    assert await schedule_service.toggle_schedule(999, False) is None

    assert sorted(s.id for s in await schedule_service.list_schedules()) == [
        first["schedule_id"],
        second["schedule_id"],
    ]
    assert [s.id for s in await schedule_service.list_schedules(enabled_only=True)] == [first["schedule_id"]]
    assert [s.id for s in await ScheduleDB.list_schedules(enabled_only=True)] == [first["schedule_id"]]

    assert await schedule_service.delete_schedule(first["schedule_id"]) == {
        "success": True,
        "schedule_id": first["schedule_id"],
        "message": "Schedule removed",
    }
    assert [s.id for s in await schedule_service.list_schedules()] == [second["schedule_id"]]


@requires_db
async def test_delete_workflow_reports_the_schedules_it_removed(db):
    await workflow_service.create_workflow("Nightly", DEFINITION, workflow_id="w1")
    await workflow_service.create_workflow("Plain", DEFINITION, workflow_id="w2")
    await schedule_service.create_schedule("w1", "every 5 minutes")
    await schedule_service.create_schedule("w1", "hourly")

    assert await workflow_service.delete_workflow("w1") == {
        "success": True,
        "workflow_id": "w1",
        "deleted_schedules": 2,
        "message": "Workflow removed with 2 associated schedules",
    }
    assert await workflow_service.delete_workflow("w2") == {
        "success": True,
        "workflow_id": "w2",
        "deleted_schedules": 0,
        "message": "Workflow removed",
    }
    assert (await workflow_service.delete_workflow("w1"))["error"] == "Workflow w1 not found"
    assert await schedule_service.list_schedules() == []
