"""
Analytics API endpoints
Workflow metrics, top performing workflows, and activity feed
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from lib.services.scheduler.db_client import SchedulerDB


router = APIRouter()


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


@router.get("/metrics")
async def get_metrics(
    time_range: str = Query(
        default="today",
        description="Time range: today, 7days, 30days, 90days, or all",
    ),
):
    """Get workflow metrics for the specified time range."""
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

        metrics = {
            "totalWorkflows": total_workflows,
            "executionsToday": executions_in_period,
            "successRate": success_rate,
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


@router.get("/activity")
async def get_activity(
    limit: int = Query(default=20, ge=1, le=100, description="Number of recent activities to return"),
    hours_back: int = Query(default=24, ge=1, le=168, description="Number of hours to look back"),
):
    """Get recent activity feed combining executions and workflow updates."""
    try:
        activities = await SchedulerDB.get_recent_activity(limit, hours_back)

        return ActivityResponse(success=True, activities=activities)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
