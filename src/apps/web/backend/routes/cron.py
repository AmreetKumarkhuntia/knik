"""Router for querying and managing Cron Schedules via Web API."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from lib.services.scheduler.db_client import SchedulerDB
from lib.services.scheduler.models import Schedule


router = APIRouter()


class ScheduleCreateRequest(BaseModel):
    trigger_workflow_id: str
    timezone: str = "UTC"


class ScheduleToggleRequest(BaseModel):
    enabled: bool


@router.get("/")
async def list_schedules():
    """List all active cron schedules."""
    try:
        schedules = await SchedulerDB.list_schedules()
        # Return dictionaries for JSON serialization
        results = [
            {
                "id": s.id,
                "trigger_workflow_id": s.trigger_workflow_id,
                "timezone": s.timezone,
                "created_at": s.created_at,
                "updated_at": s.updated_at,
                "last_executed_at": s.last_executed_at,
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
            trigger_workflow_id=req.trigger_workflow_id,
            timezone=req.timezone,
            enabled=True,
        )
        schedule_id = await SchedulerDB.create_schedule(schedule)
        return {"success": True, "schedule_id": schedule_id}
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


@router.patch("/{schedule_id}/toggle")
async def toggle_schedule(schedule_id: int, req: ScheduleToggleRequest):
    """Toggle a schedule's enabled status."""
    try:
        schedule = await SchedulerDB.toggle_schedule(schedule_id, req.enabled)
        if not schedule:
            raise HTTPException(status_code=404, detail="Schedule not found")
        return {
            "success": True,
            "schedule": {
                "id": schedule.id,
                "trigger_workflow_id": schedule.trigger_workflow_id,
                "enabled": schedule.enabled,
                "timezone": schedule.timezone,
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
