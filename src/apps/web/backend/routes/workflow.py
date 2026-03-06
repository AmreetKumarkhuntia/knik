"""Router for querying, managing, and executing Workflows via Web API."""

from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from lib.services.scheduler.db_client import SchedulerDB
from lib.services.scheduler.scheduler import Scheduler


router = APIRouter()

# Global scheduler instance for executing workflows
# In a real app this might be dependency injected, but we'll instantiate it here.
# Note: execution will need the AIClient if AI nodes are used.
scheduler = Scheduler()


class WorkflowExecuteRequest(BaseModel):
    inputs: dict[str, Any] | None = None


@router.get("/")
async def list_workflows():
    """List all registered workflows."""
    try:
        workflows = await SchedulerDB.list_workflows()
        results = [
            {
                "id": w.id,
                "name": w.name,
                "description": w.description,
            }
            for w in workflows
        ]
        return {"success": True, "workflows": results, "total": len(results)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/{workflow_id}")
async def get_workflow(workflow_id: str):
    """Get workflow details by ID."""
    try:
        workflow = await SchedulerDB.get_workflow(workflow_id)
        if not workflow:
            raise HTTPException(status_code=404, detail="Workflow not found")
        return {"success": True, "workflow": workflow.definition}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.delete("/{workflow_id}")
async def delete_workflow(workflow_id: str):
    """Delete a workflow."""
    try:
        await SchedulerDB.delete_workflow(workflow_id)
        return {"success": True, "message": f"Workflow {workflow_id} removed"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/{workflow_id}/execute")
async def execute_workflow(workflow_id: str, request: WorkflowExecuteRequest):
    """Execute a workflow manually."""
    try:
        # Note: If the workflow uses AI nodes, the scheduler needs an ai_client
        # which should ideally be passed in or initialized by the app state.
        result = await scheduler.execute_workflow(workflow_id, request.inputs)
        return {"success": True, "result": result}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/{workflow_id}/history")
async def workflow_history(workflow_id: str):
    """Get execution history for a specific workflow."""
    try:
        history = await SchedulerDB.get_execution_history(workflow_id)
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
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/{workflow_id}/executions/{execution_id}/nodes")
async def get_node_executions(workflow_id: str, execution_id: int):
    """Get node execution traces for a specific workflow execution."""
    try:
        node_executions = await SchedulerDB.get_node_executions(execution_id)
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
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
