"""Service layer for Workflow CRUD operations.

Single entry point for all workflow management — used by the AI tools, web routes, console commands
and the Scheduler. An unknown id raises ``NotFoundError`` and an invalid definition ``ValidationError``
(both from ``lib.workflows.errors``).

Definitions are stored, and returned, in the canonical form of ``lib.workflows.schema``; one saved before
that form existed is converted when it is read.
"""

import uuid
from typing import Any

from lib.services.db import ScheduleDB, WorkflowDB
from lib.services.db.models import Workflow
from lib.utils import printer
from lib.workflows.errors import NotFoundError, ValidationError
from lib.workflows.schema import normalize_definition
from lib.workflows.validation import validate_workflow_definition


def _validated(definition: dict[str, Any]) -> dict[str, Any]:
    """The definition in canonical form; ValidationError, with the validator's 'details', when it is invalid."""
    validation_result = validate_workflow_definition(definition)
    if not validation_result["valid"]:
        raise ValidationError(
            f"Invalid workflow definition: {validation_result['message']}",
            details=validation_result.get("details"),
        )
    return normalize_definition(definition)


def _with_canonical_definition(workflow: Workflow) -> Workflow:
    workflow.definition = normalize_definition(workflow.definition)
    return workflow


def _not_found(workflow_id: str) -> NotFoundError:
    return NotFoundError(f"Workflow {workflow_id} not found", workflow_id=workflow_id)


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
        Dict with 'success', 'workflow_id', 'name' and 'description'.

    Raises:
        ValidationError: the definition is invalid.
    """
    definition = _validated(definition)

    if not workflow_id:
        workflow_id = f"workflow_{uuid.uuid4().hex[:12]}"

    workflow = Workflow(
        id=workflow_id,
        name=name,
        definition=definition,
        description=description,
    )

    await WorkflowDB.create_workflow(workflow)

    printer.info(f"Workflow created successfully: {workflow_id}")
    return {
        "success": True,
        "workflow_id": workflow_id,
        "name": name,
        "description": description,
    }


async def update_workflow(
    workflow_id: str,
    name: str,
    definition: dict[str, Any],
    description: str | None = None,
) -> dict[str, Any]:
    """Update an existing workflow's name, definition, and description.

    Args:
        workflow_id: ID of the workflow to update (must already exist).
        name: New human-readable workflow name.
        definition: New DAG definition dict with 'nodes' and 'connections'.
        description: Optional new description; preserved if None.

    Returns:
        Dict with 'success', 'workflow_id', 'name' and 'description'.

    Raises:
        NotFoundError: no workflow has this id (checked before the definition).
        ValidationError: the definition is invalid.
    """
    existing = await WorkflowDB.get_workflow(workflow_id)
    if not existing:
        raise _not_found(workflow_id)

    definition = _validated(definition)

    workflow = Workflow(
        id=workflow_id,
        name=name,
        definition=definition,
        description=description if description is not None else existing.description,
    )
    await WorkflowDB.create_workflow(workflow)  # upsert via ON CONFLICT DO UPDATE

    printer.info(f"Workflow updated successfully: {workflow_id}")
    return {
        "success": True,
        "workflow_id": workflow_id,
        "name": name,
        "description": workflow.description,
    }


async def get_workflow(workflow_id: str) -> Workflow | None:
    """Retrieve a workflow by ID."""
    workflow = await WorkflowDB.get_workflow(workflow_id)
    return _with_canonical_definition(workflow) if workflow else None


async def list_workflows() -> list[Workflow]:
    """List all registered workflows."""
    return [_with_canonical_definition(workflow) for workflow in await WorkflowDB.list_workflows()]


async def delete_workflow(workflow_id: str, cascade: bool = True) -> dict[str, Any]:
    """Delete a workflow, optionally cascading to associated schedules.

    Args:
        workflow_id: The workflow ID to delete.
        cascade: If True (default), also delete associated schedules.
                 This fixes the behavioral bug where the web route did NOT
                 cascade but the MCP tool did.

    Returns:
        Dict with 'success', 'workflow_id', 'deleted_schedules' and 'message'.

    Raises:
        NotFoundError: no workflow has this id.
    """
    workflow = await WorkflowDB.get_workflow(workflow_id)
    if not workflow:
        raise _not_found(workflow_id)

    deleted_schedules = 0
    if cascade:
        deleted_schedules = await ScheduleDB.delete_schedules_by_workflow(workflow_id)

    await WorkflowDB.delete_workflow(workflow_id)

    printer.info(f"Workflow {workflow_id} deleted (cascade={cascade}, schedules_removed={deleted_schedules})")
    return {
        "success": True,
        "workflow_id": workflow_id,
        "deleted_schedules": deleted_schedules,
        "message": "Workflow removed"
        + (f" with {deleted_schedules} associated schedules" if deleted_schedules else ""),
    }
