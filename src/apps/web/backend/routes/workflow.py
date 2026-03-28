"""Router for querying, managing, and executing Workflows via Web API."""

from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from lib.cron import workflow_service
from lib.cron.scheduler import Scheduler
from lib.services.scheduler.db_client import SchedulerDB


router = APIRouter()

scheduler = Scheduler()


class WorkflowExecuteRequest(BaseModel):
    """Request body for executing a workflow."""

    inputs: dict[str, Any] | None = None


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
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.delete("/{workflow_id}")
async def delete_workflow(workflow_id: str):
    """Delete a workflow and its associated schedules."""
    try:
        result = await workflow_service.delete_workflow(workflow_id, cascade=True)
        if "error" in result:
            raise HTTPException(status_code=404, detail=result["error"])
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/{workflow_id}/execute")
async def execute_workflow(workflow_id: str, request: WorkflowExecuteRequest):
    """Execute a workflow manually."""
    try:
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
