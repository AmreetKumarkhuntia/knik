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
