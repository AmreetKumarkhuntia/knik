"""Router for querying and managing Cron Schedules via Web API."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from lib.cron import schedule_service
from lib.cron.models import Schedule


router = APIRouter()


class ScheduleCreateRequest(BaseModel):
    """Request body for creating a new cron schedule."""

    target_workflow_id: str
    schedule_description: str
    timezone: str = "UTC"


class ScheduleToggleRequest(BaseModel):
    """Request body for toggling a schedule's enabled status."""

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
        schedules = await schedule_service.list_schedules()
        results = [_serialize_schedule(s) for s in schedules]
        return {"success": True, "schedules": results, "total": len(results)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/")
async def add_schedule(req: ScheduleCreateRequest):
    """Add a new cron schedule with natural language description."""
    try:
        result = await schedule_service.create_schedule(req.target_workflow_id, req.schedule_description, req.timezone)
        if "error" in result:
            status_code = 400 if "hint" in result or "required" in result.get("error", "") else 500
            raise HTTPException(status_code=status_code, detail=result)
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.delete("/{schedule_id}")
async def remove_schedule(schedule_id: int):
    """Remove a cron schedule by ID."""
    try:
        result = await schedule_service.delete_schedule(schedule_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.patch("/{schedule_id}/toggle")
async def toggle_schedule(schedule_id: int, req: ScheduleToggleRequest):
    """Toggle a schedule's enabled status."""
    try:
        schedule = await schedule_service.toggle_schedule(schedule_id, req.enabled)
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
