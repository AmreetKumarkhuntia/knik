"""Service layer for Workflow CRUD operations.

Single entry point for all workflow management — used by MCP tools,
web routes, console commands, and the Scheduler class.
"""

import uuid
from typing import Any

from lib.cron.models import Workflow
from lib.cron.validation import validate_workflow_definition
from lib.services.scheduler.db_client import SchedulerDB
from lib.utils import printer


async def create_workflow(
    name: str,
    definition: dict[str, Any],
    description: str | None = None,
    workflow_id: str | None = None,
) -> dict[str, Any]:
    """Create a new workflow with validation and optional auto-generated ID.

    Args:
        name: Human-readable workflow name.
        definition: DAG definition dict with 'nodes' and 'connections'.
        description: Optional workflow description.
        workflow_id: Optional explicit ID. Auto-generated if not provided.

    Returns:
        Dict with 'success', 'workflow_id', 'name', 'description' on success,
        or 'error' (and optionally 'details') on failure.
    """
    validation_result = validate_workflow_definition(definition)
    if not validation_result["valid"]:
        return {
            "error": f"Invalid workflow definition: {validation_result['message']}",
            "details": validation_result.get("details"),
        }

    if not workflow_id:
        workflow_id = f"workflow_{uuid.uuid4().hex[:12]}"

    workflow = Workflow(
        id=workflow_id,
        name=name,
        definition=definition,
        description=description,
    )

    await SchedulerDB.create_workflow(workflow)

    printer.info(f"Workflow created successfully: {workflow_id}")
    return {
        "success": True,
        "workflow_id": workflow_id,
        "name": name,
        "description": description,
    }


async def get_workflow(workflow_id: str) -> Workflow | None:
    """Retrieve a workflow by ID."""
    return await SchedulerDB.get_workflow(workflow_id)


async def list_workflows() -> list[Workflow]:
    """List all registered workflows."""
    return await SchedulerDB.list_workflows()


async def delete_workflow(workflow_id: str, cascade: bool = True) -> dict[str, Any]:
    """Delete a workflow, optionally cascading to associated schedules.

    Args:
        workflow_id: The workflow ID to delete.
        cascade: If True (default), also delete associated schedules.
                 This fixes the behavioral bug where the web route did NOT
                 cascade but the MCP tool did.

    Returns:
        Dict with 'success' and deletion details, or 'error' if not found.
    """
    workflow = await SchedulerDB.get_workflow(workflow_id)
    if not workflow:
        return {"error": f"Workflow {workflow_id} not found", "workflow_id": workflow_id}

    deleted_schedules = 0
    if cascade:
        deleted_schedules = await SchedulerDB.delete_schedules_by_workflow(workflow_id)

    await SchedulerDB.delete_workflow(workflow_id)

    printer.info(f"Workflow {workflow_id} deleted (cascade={cascade}, schedules_removed={deleted_schedules})")
    return {
        "success": True,
        "workflow_id": workflow_id,
        "deleted_schedules": deleted_schedules,
        "message": "Workflow removed"
        + (f" with {deleted_schedules} associated schedules" if deleted_schedules else ""),
    }
