from typing import Any

from lib.cron import schedule_service
from lib.services.ai_client.base_tool import BaseTool


CRON_DEFINITIONS = [
    {
        "name": "list_cron_schedules",
        "description": "List all active cron schedules for workflows. When asked for cron jobs use this function until explicitly asked to check for system cron jobs.",
        "parameters": {
            "type": "object",
            "properties": {},
            "required": [],
        },
    },
    {
        "name": "add_cron_schedule",
        "description": "Add a new cron schedule with natural language description. The schedule will trigger the target workflow at the specified times.",
        "parameters": {
            "type": "object",
            "properties": {
                "target_workflow_id": {
                    "type": "string",
                    "description": "The ID of the workflow to be triggered when this schedule fires",
                },
                "schedule_description": {
                    "type": "string",
                    "description": "Natural language description of when the schedule should trigger (e.g., 'daily at 9am', 'every Monday at 2pm', 'every 6 hours')",
                },
                "timezone": {
                    "type": "string",
                    "description": "Timezone string like 'UTC', 'GMT+5:30', 'America/New_York'. Default: 'UTC'",
                    "default": "UTC",
                },
            },
            "required": ["target_workflow_id", "schedule_description"],
        },
    },
    {
        "name": "remove_cron_schedule",
        "description": "Remove an existing cron schedule by ID. When asked for cron jobs use this function until explicitly asked to check for system cron jobs.",
        "parameters": {
            "type": "object",
            "properties": {
                "schedule_id": {
                    "type": "integer",
                    "description": "The integer ID of the schedule to remove",
                }
            },
            "required": ["schedule_id"],
        },
    },
]
from lib.utils.async_utils import run_async
from lib.utils.printer import printer


class CronTool(BaseTool):
    @property
    def name(self) -> str:
        return "cron"

    def get_definitions(self):
        return CRON_DEFINITIONS

    def get_implementations(self):
        return {
            "list_cron_schedules": self._list_cron_schedules,
            "add_cron_schedule": self._add_cron_schedule,
            "remove_cron_schedule": self._remove_cron_schedule,
        }

    @staticmethod
    def _list_cron_schedules() -> dict[str, Any]:
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

    @staticmethod
    def _add_cron_schedule(target_workflow_id: str, schedule_description: str, timezone: str = "UTC") -> dict[str, Any]:
        printer.info(f"Adding cron schedule for target workflow '{target_workflow_id}'")
        try:
            result = run_async(schedule_service.create_schedule(target_workflow_id, schedule_description, timezone))
            return result
        except Exception as e:
            printer.error(f"Error adding cron schedule: {e}")
            return {"error": f"Failed to add schedule: {str(e)}", "details": "An unexpected error occurred"}

    @staticmethod
    def _remove_cron_schedule(schedule_id: int) -> dict[str, Any]:
        printer.info(f"Removing cron schedule ID: {schedule_id}")
        try:
            result = run_async(schedule_service.delete_schedule(schedule_id))
            return result
        except Exception as e:
            printer.error(f"Error removing cron schedule: {e}")
            return {"error": f"Failed to remove schedule: {str(e)}"}
