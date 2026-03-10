import asyncio
from typing import Any

from lib.services.scheduler.db_client import SchedulerDB
from lib.services.scheduler.models import Schedule
from lib.utils.printer import printer
from lib.utils.timezone_utils import validate_timezone


def _run_async(coro):
    """Run an async coroutine synchronously."""
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = None

    if loop and loop.is_running():
        # If we are already running in an event loop, create a future and block (not recommended but works in threads)
        # Ideally, MCP tools would just be async. If MCP supports async, we could drop this.
        # But assuming MCP functions are sync based on definitions:
        import nest_asyncio

        nest_asyncio.apply()
        return asyncio.run(coro)
    else:
        return asyncio.run(coro)


def list_cron_schedules() -> dict[str, Any]:
    """List all active cron schedules minimally."""
    printer.info("🔧 Listing active cron schedules")
    try:
        schedules = _run_async(SchedulerDB.list_schedules())
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
    printer.info(f"🔧 Adding cron schedule for target workflow '{target_workflow_id}'")

    if not target_workflow_id:
        return {"error": "target_workflow_id is required"}

    if not schedule_description:
        return {"error": "schedule_description is required"}

    is_valid_tz, tz_error = validate_timezone(timezone)
    if not is_valid_tz:
        printer.error(f"Invalid timezone: {tz_error}")
        return {"error": tz_error}

    try:
        from lib.mcp.implementations.workflow_impl import _calculate_first_run, _parse_recurrence_seconds

        try:
            first_run = _calculate_first_run(schedule_description, timezone)
        except ValueError as e:
            printer.error(f"Invalid schedule description: {e}")
            return {
                "error": f"Invalid schedule description: {str(e)}",
                "hint": "Try formats like 'every 5 minutes', 'daily at 9am', 'every Monday at 2pm', or 'hourly'",
            }

        recurrence_seconds = _parse_recurrence_seconds(schedule_description)

        printer.info("   Schedule parsed successfully:")
        printer.info(f"   - First run: {first_run.isoformat()}")
        printer.info(
            f"   - Recurrence: {recurrence_seconds}s ({recurrence_seconds // 60} minutes)"
            if recurrence_seconds
            else "   - Recurrence: None (one-time)"
        )
        printer.info(f"   - Timezone: {timezone}")

        schedule = Schedule(
            id=0,
            target_workflow_id=target_workflow_id,
            enabled=True,
            timezone=timezone,
            schedule_description=schedule_description,
            next_run_at=first_run,
            recurrence_seconds=recurrence_seconds,
        )

        schedule_id = _run_async(SchedulerDB.create_schedule(schedule))

        printer.success(f"✅ Cron schedule created successfully (ID: {schedule_id})")

        return {
            "success": True,
            "schedule_id": schedule_id,
            "next_run_at": first_run.isoformat(),
            "recurrence_seconds": recurrence_seconds,
            "message": f"Schedule created successfully. Next run at {first_run.strftime('%Y-%m-%d %H:%M:%S %Z')}",
        }

    except Exception as e:
        printer.error(f"Error adding cron schedule: {e}")
        return {"error": f"Failed to add schedule: {str(e)}", "details": "An unexpected error occurred"}


def remove_cron_schedule(schedule_id: int) -> dict[str, Any]:
    """Remove a cron schedule."""
    printer.info(f"🔧 Removing cron schedule ID: {schedule_id}")
    try:
        _run_async(SchedulerDB.delete_schedule(schedule_id))
        return {"success": True, "schedule_id": schedule_id, "message": "Schedule removed"}
    except Exception as e:
        printer.error(f"Error listing cron schedules: {e}")
        return {"error": f"Failed to remove schedule: {str(e)}"}


CRON_IMPLEMENTATIONS = {
    "list_cron_schedules": list_cron_schedules,
    "add_cron_schedule": add_cron_schedule,
    "remove_cron_schedule": remove_cron_schedule,
}
