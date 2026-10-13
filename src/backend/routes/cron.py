"""Router for querying and managing Cron Schedules via Web API."""

from fastapi import APIRouter, HTTPException

from backend.models.cron import ScheduleCreateRequest, ScheduleToggleRequest
from imports import DB_ERRORS, schedule_service


router = APIRouter()


@router.get("/")
async def list_schedules():
    """List all cron schedules, enabled and disabled, so disabled ones can be toggled back on."""
    try:
        schedules = await schedule_service.list_schedules(enabled_only=False)
        results = [s.to_dict() for s in schedules]
        return {"success": True, "schedules": results, "total": len(results)}
    except DB_ERRORS:
        raise
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
    except (HTTPException, *DB_ERRORS):
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.delete("/{schedule_id}")
async def remove_schedule(schedule_id: int):
    """Remove a cron schedule by ID."""
    try:
        result = await schedule_service.delete_schedule(schedule_id)
        return result
    except DB_ERRORS:
        raise
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
            "schedule": schedule.to_dict(),
        }
    except (HTTPException, *DB_ERRORS):
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
