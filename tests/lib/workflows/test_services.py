"""workflow_service and schedule_service against a real database (validation and not-found paths need none)."""

from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest

from lib.services.db import ExecutionDB, ScheduleDB, Workflow, WorkflowDB
from lib.workflows import schedule_service, workflow_service
from lib.workflows.engine import WorkflowEngine
from lib.workflows.errors import NotFoundError, ValidationError
from tests.db_support import requires_db
from tests.lib.workflows.support import FRONTEND_DEFINITION, LEGACY_DEFINITION, LEGACY_DEFINITION_CANONICAL


pytestmark = pytest.mark.asyncio

DEFINITION = {
    "nodes": {
        "double": {"type": "FunctionExecutionNode", "code": "output = 21 * 2"},
    },
    "connections": [],
}


BAD_NODE_TYPE = {"nodes": {"a": {"type": "Teleport"}}, "connections": []}


@pytest.fixture
def no_workflows(monkeypatch):
    """WorkflowDB as seen by workflow_service, holding no workflows."""
    workflows = SimpleNamespace(get_workflow=AsyncMock(return_value=None), create_workflow=AsyncMock())
    monkeypatch.setattr(workflow_service, "WorkflowDB", workflows)
    return workflows


async def test_create_workflow_rejects_an_invalid_definition():
    with pytest.raises(ValidationError) as caught:
        await workflow_service.create_workflow("Bad", {"nodes": {}})
    assert caught.value.to_dict() == {
        "error": "Invalid workflow definition: Definition must contain 'connections' key",
        "details": None,
    }

    with pytest.raises(ValidationError) as caught:
        await workflow_service.create_workflow("Bad", BAD_NODE_TYPE)
    assert str(caught.value) == "Invalid workflow definition: Node a has invalid type 'Teleport'"
    assert caught.value.extra["details"]["invalid_type"] == "Teleport"


async def test_a_definition_naming_an_unknown_function_is_rejected(no_workflows):
    definition = {"nodes": {"a": {"type": "FunctionExecutionNode", "function_name": "teleport"}}, "connections": []}

    with pytest.raises(ValidationError) as caught:
        await workflow_service.create_workflow("Bad", definition)

    assert str(caught.value) == "Invalid workflow definition: Node a calls unknown function 'teleport'"
    assert caught.value.extra["details"]["function_name"] == "teleport"
    no_workflows.create_workflow.assert_not_awaited()


async def test_create_and_update_store_the_canonical_definition(no_workflows):
    await workflow_service.create_workflow("Old", LEGACY_DEFINITION, workflow_id="w1")
    no_workflows.get_workflow.return_value = Workflow(id="w1", name="Old", definition={})
    await workflow_service.update_workflow("w1", "Old", LEGACY_DEFINITION)

    stored = [call.args[0].definition for call in no_workflows.create_workflow.await_args_list]
    assert stored == [LEGACY_DEFINITION_CANONICAL, LEGACY_DEFINITION_CANONICAL]


async def test_update_and_delete_of_an_unknown_workflow_raise_not_found(no_workflows):
    expected = {"error": "Workflow missing not found", "workflow_id": "missing"}

    # The id is checked before the definition, so an invalid one still reports the missing workflow.
    for definition in (DEFINITION, BAD_NODE_TYPE):
        with pytest.raises(NotFoundError) as caught:
            await workflow_service.update_workflow("missing", "x", definition)
        assert caught.value.to_dict() == expected

    with pytest.raises(NotFoundError) as caught:
        await workflow_service.delete_workflow("missing")
    assert caught.value.to_dict() == expected
    no_workflows.create_workflow.assert_not_awaited()


@pytest.mark.parametrize(
    ("args", "expected"),
    [
        (("", "every 5 minutes"), {"error": "target_workflow_id is required"}),
        (("w", ""), {"error": "schedule_description is required"}),
        (
            ("w", "every 5 minutes", "Mars/Olympus"),
            {
                "error": "Invalid timezone: 'Mars/Olympus'. Use IANA format (e.g., 'America/New_York', "
                "'Asia/Kolkata') or GMT/UTC offset (e.g., 'GMT+5:30', 'UTC-5')"
            },
        ),
    ],
)
async def test_create_schedule_rejects_bad_input(args, expected):
    with pytest.raises(ValidationError) as caught:
        await schedule_service.create_schedule(*args)
    assert caught.value.to_dict() == expected


async def test_an_unparseable_schedule_description_comes_with_a_hint():
    with pytest.raises(ValidationError) as caught:
        await schedule_service.create_schedule("w", "whenever you like")
    assert str(caught.value).startswith("Invalid schedule description")
    assert list(caught.value.to_dict()) == ["error", "hint"]
    assert caught.value.extra["hint"].startswith("Try formats like")


@requires_db
async def test_workflow_lifecycle(db):
    created = await workflow_service.create_workflow("Nightly", DEFINITION, description="d", workflow_id="w1")
    assert created == {"success": True, "workflow_id": "w1", "name": "Nightly", "description": "d"}

    updated = await workflow_service.update_workflow("w1", "Nightly v2", DEFINITION)
    assert updated == {"success": True, "workflow_id": "w1", "name": "Nightly v2", "description": "d"}
    with pytest.raises(NotFoundError):
        await workflow_service.update_workflow("missing", "x", DEFINITION)
    with pytest.raises(ValidationError):
        await workflow_service.update_workflow("w1", "Broken", BAD_NODE_TYPE)

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
    with pytest.raises(NotFoundError, match="^Workflow w1 not found$"):
        await workflow_service.delete_workflow("w1")
    assert await schedule_service.list_schedules() == []


@requires_db
async def test_a_frontend_definition_is_stored_and_read_back_as_sent(db):
    created = await workflow_service.create_workflow("Builder", FRONTEND_DEFINITION)

    workflow = await workflow_service.get_workflow(created["workflow_id"])
    assert workflow is not None
    assert workflow.definition == FRONTEND_DEFINITION
    [listed] = await workflow_service.list_workflows()
    assert listed.definition == FRONTEND_DEFINITION


@requires_db
async def test_an_older_stored_definition_is_read_in_canonical_form(db):
    await WorkflowDB.create_workflow(Workflow(id="old", name="Old", definition=LEGACY_DEFINITION))

    workflow = await workflow_service.get_workflow("old")
    assert workflow is not None
    assert workflow.definition == LEGACY_DEFINITION_CANONICAL
    [listed] = await workflow_service.list_workflows()
    assert listed.definition == LEGACY_DEFINITION_CANONICAL
    # Reading does not rewrite the row; the next save does.
    stored = await WorkflowDB.get_workflow("old")
    assert stored is not None and stored.definition == LEGACY_DEFINITION
