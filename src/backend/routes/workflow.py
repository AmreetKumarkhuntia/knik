"""Router for querying, managing, and executing Workflows via Web API."""

from fastapi import APIRouter, Depends, HTTPException

from backend.deps import get_state
from backend.models.workflow import (
    WorkflowCreateRequest,
    WorkflowExecuteRequest,
    WorkflowUpdateRequest,
)
from backend.state import AppState
from imports import DB_ERRORS, ExecutionDB, NotFoundError, ValidationError, workflow_service


router = APIRouter()


@router.get("/")
async def list_workflows():
    """List all registered workflows."""
    try:
        workflows = await workflow_service.list_workflows()
        results = [
            {
                "id": w.id,
                "name": w.name,
                "description": w.description,
            }
            for w in workflows
        ]
        return {"success": True, "workflows": results, "total": len(results)}
    except DB_ERRORS:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/")
async def create_workflow(request: WorkflowCreateRequest):
    """Create a new workflow from a name + DAG definition."""
    try:
        result = await workflow_service.create_workflow(
            name=request.name,
            definition=request.definition,
            description=request.description,
        )
        return {"success": True, "workflow": request.definition, **result}
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except DB_ERRORS:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/{workflow_id}")
async def get_workflow(workflow_id: str):
    """Get workflow details by ID."""
    try:
        workflow = await workflow_service.get_workflow(workflow_id)
        if not workflow:
            raise HTTPException(status_code=404, detail="Workflow not found")
        return {"success": True, "workflow": workflow.definition}
    except (HTTPException, *DB_ERRORS):
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.patch("/{workflow_id}")
async def update_workflow(workflow_id: str, request: WorkflowUpdateRequest):
    """Update an existing workflow's name, definition, and description; a field left out keeps its value."""
    try:
        name, definition = request.name, request.definition
        if name is None or definition is None:
            current = await workflow_service.get_workflow(workflow_id)
            if current is None:
                raise NotFoundError(f"Workflow {workflow_id} not found", workflow_id=workflow_id)
            name = current.name if name is None else name
            definition = current.definition if definition is None else definition

        result = await workflow_service.update_workflow(
            workflow_id=workflow_id,
            name=name,
            definition=definition,
            description=request.description,
        )
        return {"success": True, "workflow": definition, **result}
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except DB_ERRORS:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.delete("/{workflow_id}")
async def delete_workflow(workflow_id: str):
    """Delete a workflow and its associated schedules."""
    try:
        return await workflow_service.delete_workflow(workflow_id, cascade=True)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
    except DB_ERRORS:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/{workflow_id}/execute")
async def execute_workflow(workflow_id: str, request: WorkflowExecuteRequest, state: AppState = Depends(get_state)):
    """Execute a workflow manually."""
    try:
        result = await state.scheduler.run(workflow_id, request.inputs)
        return {"success": True, "result": result}
    except ValueError as e:
        # NotFoundError for an unknown id, or the engine rejecting the workflow (invalid DAG, unknown node type).
        raise HTTPException(status_code=404, detail=str(e)) from e
    except DB_ERRORS:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/{workflow_id}/history")
async def workflow_history(workflow_id: str):
    """Get execution history for a specific workflow."""
    try:
        history = await ExecutionDB.get_execution_history(workflow_id)
        results = [
            {
                "id": h.id,
                "status": h.status,
                "started_at": h.started_at,
                "duration_ms": h.duration_ms,
                "error_message": h.error_message,
            }
            for h in history
        ]
        return {"success": True, "history": results, "total": len(results)}
    except DB_ERRORS:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/{workflow_id}/executions/{execution_id}/nodes")
async def get_node_executions(workflow_id: str, execution_id: int):
    """Get node execution traces for a specific workflow execution."""
    try:
        node_executions = await ExecutionDB.get_node_executions(execution_id)
        results = [
            {
                "id": ne.id,
                "execution_id": ne.execution_id,
                "node_id": ne.node_id,
                "node_type": ne.node_type,
                "status": ne.status,
                "started_at": ne.started_at,
                "completed_at": ne.completed_at,
                "duration_ms": ne.duration_ms,
                "error_message": ne.error_message,
                "inputs": ne.inputs,
                "outputs": ne.outputs,
            }
            for ne in node_executions
        ]
        return {"success": True, "node_executions": results, "total": len(results)}
    except DB_ERRORS:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
