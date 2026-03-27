"""Service layer for Schedule (cron) CRUD operations.

Single entry point for all schedule management — used by MCP tools,
web routes, and the Scheduler class.
"""

from typing import Any

from lib.cron.models import Schedule
from lib.cron.schedule_parser import calculate_first_run, parse_recurrence_seconds
from lib.services.scheduler.db_client import SchedulerDB
from lib.utils import printer
from lib.utils.timezone_utils import validate_timezone


async def create_schedule(
    target_workflow_id: str,
    schedule_description: str,
    timezone: str = "UTC",
) -> dict[str, Any]:
    """Create a new cron schedule with NLP-based description parsing.

    Args:
        target_workflow_id: The workflow to schedule.
        schedule_description: Natural language description (e.g. 'every 5 minutes', 'daily at 9am').
        timezone: Timezone string (IANA or GMT/UTC offset). Default: 'UTC'.

    Returns:
        Dict with 'success', 'schedule_id', 'next_run_at', 'recurrence_seconds' on success,
        or 'error' (and optionally 'hint') on failure.
    """
    if not target_workflow_id:
        return {"error": "target_workflow_id is required"}

    if not schedule_description:
        return {"error": "schedule_description is required"}

    is_valid_tz, tz_error = validate_timezone(timezone)
    if not is_valid_tz:
        return {"error": tz_error}

    try:
        first_run = calculate_first_run(schedule_description, timezone)
    except ValueError as e:
        return {
            "error": f"Invalid schedule description: {str(e)}",
            "hint": "Try formats like 'every 5 minutes', 'daily at 9am', 'every Monday at 2pm', or 'hourly'",
        }

    recurrence_seconds = parse_recurrence_seconds(schedule_description)

    printer.info(f"Schedule parsed: first_run={first_run.isoformat()}, recurrence={recurrence_seconds}s, tz={timezone}")

    schedule = Schedule(
        id=0,
        target_workflow_id=target_workflow_id,
        enabled=True,
        timezone=timezone,
        schedule_description=schedule_description,
        next_run_at=first_run,
        recurrence_seconds=recurrence_seconds,
    )

    schedule_id = await SchedulerDB.create_schedule(schedule)

    printer.info(f"Schedule created: id={schedule_id}")
    return {
        "success": True,
        "schedule_id": schedule_id,
        "next_run_at": first_run.isoformat(),
        "recurrence_seconds": recurrence_seconds,
        "message": f"Schedule created successfully. Next run at {first_run.strftime('%Y-%m-%d %H:%M:%S %Z')}",
    }


async def list_schedules() -> list[Schedule]:
    """List all active (enabled) schedules."""
    return await SchedulerDB.list_schedules()


async def delete_schedule(schedule_id: int) -> dict[str, Any]:
    """Delete a schedule by ID.

    Returns:
        Dict with 'success' and 'schedule_id' on success.
    """
    await SchedulerDB.delete_schedule(schedule_id)
    printer.info(f"Schedule {schedule_id} deleted")
    return {
        "success": True,
        "schedule_id": schedule_id,
        "message": "Schedule removed",
    }


async def toggle_schedule(schedule_id: int, enabled: bool) -> Schedule | None:
    """Toggle a schedule's enabled/disabled status.

    Returns:
        The updated Schedule if found, or None if not found.
    """
    return await SchedulerDB.toggle_schedule(schedule_id, enabled)
