"""Router for querying and managing Cron Schedules via Web API."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from lib.services.scheduler.db_client import SchedulerDB
from lib.services.scheduler.models import Schedule


router = APIRouter()


class ScheduleCreateRequest(BaseModel):
    workflow_id: str
    cron_expression: str
    timezone: str = "UTC"


@router.get("/")
async def list_schedules():
    """List all active cron schedules."""
    try:
        schedules = await SchedulerDB.list_schedules()
        # Return dictionaries for JSON serialization
        results = [
            {
                "id": s.id,
                "workflow_id": s.workflow_id,
                "cron_expression": s.cron_expression,
                "timezone": s.timezone,
            }
            for s in schedules
        ]
        return {"success": True, "schedules": results, "total": len(results)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/")
async def add_schedule(req: ScheduleCreateRequest):
    """Add a new cron schedule."""
    try:
        schedule = Schedule(
            id=0,  # Auto-assigned by DB
            workflow_id=req.workflow_id,
            cron_expression=req.cron_expression,
            timezone=req.timezone,
            enabled=True,
        )
        schedule_id = await SchedulerDB.create_schedule(schedule)
        return {"success": True, "schedule_id": schedule_id, "workflow_id": req.workflow_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.delete("/{schedule_id}")
async def remove_schedule(schedule_id: int):
    """Remove a cron schedule by ID."""
    try:
        await SchedulerDB.delete_schedule(schedule_id)
        return {"success": True, "schedule_id": schedule_id, "message": "Schedule removed"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
