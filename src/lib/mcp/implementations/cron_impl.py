import asyncio
from typing import Any

from lib.services.scheduler.db_client import SchedulerDB
from lib.services.scheduler.models import Schedule
from lib.utils.printer import printer


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
        results = [{"id": s.id, "workflow_id": s.workflow_id, "trigger": s.trigger_workflow_id} for s in schedules]
        return {"success": True, "schedules": results, "total": len(results)}
    except Exception as e:
        printer.error(f"Error listing cron schedules: {e}")
        return {"error": f"Failed to list schedules: {str(e)}"}


def add_cron_schedule(workflow_id: str, trigger_workflow_id: str) -> dict[str, Any]:
    """Add a new cron schedule."""
    printer.info(f"🔧 Adding cron schedule for workflow '{workflow_id}' triggered by '{trigger_workflow_id}'")
    try:
        schedule = Schedule(
            id=0,  # DB will auto-assign
            workflow_id=workflow_id,
            trigger_workflow_id=trigger_workflow_id,
            enabled=True,
        )
        schedule_id = _run_async(SchedulerDB.create_schedule(schedule))
        return {"success": True, "schedule_id": schedule_id, "workflow_id": workflow_id}
    except Exception as e:
        printer.error(f"Error listing cron schedules: {e}")
        return {"error": f"Failed to add schedule: {str(e)}"}


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
