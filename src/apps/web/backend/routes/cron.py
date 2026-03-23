"""Router for querying and managing Cron Schedules via Web API."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from lib.mcp.implementations.workflow_impl import _calculate_first_run, _parse_recurrence_seconds
from lib.services.scheduler.db_client import SchedulerDB
from lib.services.scheduler.models import Schedule


router = APIRouter()


class ScheduleCreateRequest(BaseModel):
    target_workflow_id: str
    schedule_description: str
    timezone: str = "UTC"


class ScheduleToggleRequest(BaseModel):
    enabled: bool


def _serialize_schedule(s: Schedule) -> dict:
    """Serialize a Schedule dataclass to a JSON-safe dictionary."""
    return {
        "id": s.id,
        "target_workflow_id": s.target_workflow_id,
        "enabled": s.enabled,
        "timezone": s.timezone,
        "schedule_description": s.schedule_description,
        "next_run_at": s.next_run_at.isoformat() if s.next_run_at else None,
        "recurrence_seconds": s.recurrence_seconds,
        "created_at": s.created_at.isoformat() if s.created_at else None,
        "updated_at": s.updated_at.isoformat() if s.updated_at else None,
        "last_executed_at": s.last_executed_at.isoformat() if s.last_executed_at else None,
    }


@router.get("/")
async def list_schedules():
    """List all active cron schedules."""
    try:
        schedules = await SchedulerDB.list_schedules()
        results = [_serialize_schedule(s) for s in schedules]
        return {"success": True, "schedules": results, "total": len(results)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/")
async def add_schedule(req: ScheduleCreateRequest):
    """Add a new cron schedule with natural language description."""
    try:
        # Parse natural language schedule description into timing values
        try:
            first_run = _calculate_first_run(req.schedule_description, req.timezone)
        except ValueError as e:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": f"Invalid schedule description: {str(e)}",
                    "hint": "Try formats like 'every 5 minutes', 'daily at 9am', 'every Monday at 2pm', or 'hourly'",
                },
            ) from e

        recurrence_seconds = _parse_recurrence_seconds(req.schedule_description)

        schedule = Schedule(
            id=0,  # Auto-assigned by DB
            target_workflow_id=req.target_workflow_id,
            timezone=req.timezone,
            enabled=True,
            schedule_description=req.schedule_description,
            next_run_at=first_run,
            recurrence_seconds=recurrence_seconds,
        )
        schedule_id = await SchedulerDB.create_schedule(schedule)
        return {
            "success": True,
            "schedule_id": schedule_id,
            "next_run_at": first_run.isoformat(),
            "recurrence_seconds": recurrence_seconds,
        }
    except HTTPException:
        raise
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
            "schedule": _serialize_schedule(schedule),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
