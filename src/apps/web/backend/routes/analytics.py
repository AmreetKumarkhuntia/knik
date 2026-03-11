"""
Analytics API endpoints
Workflow metrics, top performing workflows, and activity feed
"""

from datetime import UTC, datetime

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from lib.services.scheduler.db_client import SchedulerDB


router = APIRouter()


class DashboardResponse(BaseModel):
    success: bool
    data: dict


class WorkflowMetricsResponse(BaseModel):
    success: bool
    metrics: dict


class TopWorkflowsResponse(BaseModel):
    success: bool
    workflows: list[dict]
    total: int


class ActivityResponse(BaseModel):
    success: bool
    activities: list[dict]


@router.get("/dashboard")
async def get_dashboard(
    workflows_limit: int = Query(default=20, ge=1, le=100, description="Number of recent workflows to return"),
    executions_limit: int = Query(default=100, ge=1, le=500, description="Number of recent executions to return"),
):
    """
    Returns lightweight dashboard data:
    - Metrics (aggregated counts)
    - Recent workflows (minimal fields only)
    - Recent executions (minimal fields only)
    """
    try:
        end_date = datetime.now(UTC)
        start_date = end_date.replace(hour=0, minute=0, second=0, microsecond=0)

        total_workflows = await SchedulerDB.get_total_workflows()
        executions_today = await SchedulerDB.get_executions_count(start_date, end_date)
        success_rate = await SchedulerDB.get_success_rate(start_date, end_date)

        recent_workflows = await SchedulerDB.get_recent_workflows_summary(workflows_limit)
        recent_executions = await SchedulerDB.get_recent_executions_summary(executions_limit)

        return DashboardResponse(
            success=True,
            data={
                "metrics": {
                    "totalWorkflows": total_workflows,
                    "executionsToday": executions_today,
                    "successRate": success_rate,
                },
                "recentWorkflows": recent_workflows,
                "recentExecutions": recent_executions,
            },
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/metrics")
async def get_metrics(
    time_range: str = Query(
        default="today",
        description="Time range: today, 7days, 30days, 90days, or all",
    ),
    workflow_id: str = Query(default=None, description="Optional workflow ID to filter metrics"),
):
    """Get workflow execution metrics for a given time range."""
    try:
        if time_range not in ["today", "7days", "30days", "90days", "all"]:
            raise HTTPException(
                status_code=400,
                detail="Invalid time_range. Must be one of: today, 7days, 30days, 90days, all",
            )

        start_date, end_date = SchedulerDB.get_date_range(time_range)

        total_workflows = await SchedulerDB.get_total_workflows()
        executions_in_period = await SchedulerDB.get_executions_count(start_date, end_date)
        success_rate = await SchedulerDB.get_success_rate(start_date, end_date)
        avg_duration = await SchedulerDB.get_average_duration(start_date, end_date)
        active_executions = await SchedulerDB.get_active_executions_count()

        metrics = {
            "totalWorkflows": total_workflows,
            "executionsToday": executions_in_period,
            "successRate": success_rate,
            "avgDurationMs": avg_duration,
            "activeExecutions": active_executions,
            "totalExecutions": executions_in_period,
            "timeRange": time_range,
        }

        return WorkflowMetricsResponse(success=True, metrics=metrics)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/top-workflows")
async def get_top_workflows(
    limit: int = Query(default=10, ge=1, le=100, description="Number of top workflows to return"),
    time_range: str = Query(
        default="today",
        description="Time range: today, 7days, 30days, 90days, or all",
    ),
):
    """Get top performing workflows sorted by execution count."""
    try:
        if time_range not in ["today", "7days", "30days", "90days", "all"]:
            raise HTTPException(
                status_code=400,
                detail="Invalid time_range. Must be one of: today, 7days, 30days, 90days, all",
            )

        start_date, end_date = SchedulerDB.get_date_range(time_range)
        workflows = await SchedulerDB.get_top_workflows(limit, start_date, end_date)

        top_workflows = [
            {
                "id": w["id"],
                "name": w["name"],
                "icon": "account_tree",
                "status": "active",
                "executions": w["executions"],
                "successRate": w["success_rate"],
            }
            for w in workflows
        ]

        return TopWorkflowsResponse(success=True, workflows=top_workflows, total=len(top_workflows))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/executions")
async def get_executions_paginated(
    page: int = Query(default=1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(default=50, ge=1, le=100, description="Number of executions per page"),
    workflow_id: str = Query(default=None, description="Optional workflow ID to filter by"),
    status: str = Query(default=None, description="Optional status to filter by (all, running, success, failed)"),
):
    """Get paginated executions with optional filters."""
    try:
        result = await SchedulerDB.get_executions_paginated(page, page_size, workflow_id, status)
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/workflows/list")
async def get_workflows_list():
    """Get simple list of workflows for filter dropdowns."""
    try:
        workflows = await SchedulerDB.get_workflows_list()
        return {"success": True, "workflows": workflows}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/activity")
async def get_activity(
    limit: int = Query(default=20, ge=1, le=100, description="Number of recent activities to return"),
    hours_back: int = Query(default=24, ge=1, le=168, description="Number of hours to look back"),
    execution_id: int = Query(default=None, description="Optional execution ID for detailed view"),
):
    """Get recent activity feed or detailed execution information."""
    try:
        # If execution_id is provided, return detailed execution info
        if execution_id is not None:
            execution, node_traces = await SchedulerDB.get_execution_detail(execution_id)

            if not execution:
                raise HTTPException(status_code=404, detail=f"Execution {execution_id} not found")

            workflow_name = await SchedulerDB.get_workflow_name(execution.workflow_id)

            return {
                "success": True,
                "execution": {
                    "id": execution.id,
                    "workflow_id": execution.workflow_id,
                    "workflow_name": workflow_name or "Unknown Workflow",
                    "status": execution.status,
                    "inputs": execution.inputs,
                    "outputs": execution.outputs,
                    "error_message": execution.error_message,
                    "started_at": execution.started_at.isoformat() if execution.started_at else None,
                    "completed_at": execution.completed_at.isoformat() if execution.completed_at else None,
                    "duration_ms": execution.duration_ms,
                },
                "timeline": [
                    {
                        "node_id": ne.node_id,
                        "node_type": ne.node_type,
                        "status": ne.status,
                        "inputs": ne.inputs,
                        "outputs": ne.outputs,
                        "error_message": ne.error_message,
                        "started_at": ne.started_at.isoformat() if ne.started_at else None,
                        "completed_at": ne.completed_at.isoformat() if ne.completed_at else None,
                        "duration_ms": ne.duration_ms,
                    }
                    for ne in node_traces
                ],
            }

        # Otherwise, return activity feed
        activities = await SchedulerDB.get_recent_activity(limit, hours_back)

        return ActivityResponse(success=True, activities=activities)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
