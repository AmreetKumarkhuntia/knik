"""MCP tool implementation for cron schedule operations."""

from typing import Any

from lib.cron import schedule_service
from lib.utils.async_utils import run_async
from lib.utils.printer import printer


def list_cron_schedules() -> dict[str, Any]:
    """List all active cron schedules minimally."""
    printer.info("Listing active cron schedules")
    try:
        schedules = run_async(schedule_service.list_schedules())
        results = [
            {
                "id": s.id,
                "target_workflow_id": s.target_workflow_id,
                "schedule_description": s.schedule_description,
                "next_run_at": s.next_run_at.isoformat() if s.next_run_at else None,
                "recurrence_seconds": s.recurrence_seconds,
                "enabled": s.enabled,
            }
            for s in schedules
        ]
        return {"success": True, "schedules": results, "total": len(results)}
    except Exception as e:
        printer.error(f"Error listing cron schedules: {e}")
        return {"error": f"Failed to list schedules: {str(e)}"}


def add_cron_schedule(target_workflow_id: str, schedule_description: str, timezone: str = "UTC") -> dict[str, Any]:
    """Add a new cron schedule with natural language description."""
    printer.info(f"Adding cron schedule for target workflow '{target_workflow_id}'")

    try:
        result = run_async(schedule_service.create_schedule(target_workflow_id, schedule_description, timezone))
        return result

    except Exception as e:
        printer.error(f"Error adding cron schedule: {e}")
        return {"error": f"Failed to add schedule: {str(e)}", "details": "An unexpected error occurred"}


def remove_cron_schedule(schedule_id: int) -> dict[str, Any]:
    """Remove a cron schedule."""
    printer.info(f"Removing cron schedule ID: {schedule_id}")
    try:
        result = run_async(schedule_service.delete_schedule(schedule_id))
        return result
    except Exception as e:
        printer.error(f"Error removing cron schedule: {e}")
        return {"error": f"Failed to remove schedule: {str(e)}"}


CRON_IMPLEMENTATIONS = {
    "list_cron_schedules": list_cron_schedules,
    "add_cron_schedule": add_cron_schedule,
    "remove_cron_schedule": remove_cron_schedule,
}
