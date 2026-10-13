"""Schedules that trigger workflows."""

from datetime import datetime

from ..connection import PostgresDB
from ..models import Schedule
from .base import to_model, to_models


class ScheduleDB:
    @staticmethod
    async def create_schedule(schedule: Schedule) -> int:
        """Insert the schedule (its `id` is ignored) and return the new id."""
        query = """
            INSERT INTO schedules (
                target_workflow_id,
                enabled,
                timezone,
                schedule_description,
                next_run_at,
                recurrence_seconds,
                created_at,
                updated_at
            )
            VALUES (%s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING id
        """
        return await PostgresDB.fetch_val(
            query,
            (
                schedule.target_workflow_id,
                schedule.enabled,
                schedule.timezone,
                schedule.schedule_description,
                schedule.next_run_at,
                schedule.recurrence_seconds,
            ),
        )

    @staticmethod
    async def list_schedules(enabled_only: bool = False) -> list[Schedule]:
        if enabled_only:
            rows = await PostgresDB.fetch_all("SELECT * FROM schedules WHERE enabled = true")
        else:
            rows = await PostgresDB.fetch_all("SELECT * FROM schedules")
        return to_models(Schedule.from_row, rows)

    @staticmethod
    async def claim_due_run(schedule_id: int, due_at: datetime, next_run_at: datetime | None) -> Schedule | None:
        """Take the occurrence of an enabled schedule due at `due_at`, so that only one caller runs it.

        Moves the schedule on to `next_run_at`, or disables it when that is None (a one-shot schedule), and stamps
        `last_executed_at`. Returns the updated schedule, or None when the schedule is no longer enabled and due at
        `due_at`: another poller claimed the occurrence first, or the schedule was changed or deleted meanwhile.
        """
        row = await PostgresDB.fetch_one(
            """
            UPDATE schedules
            SET next_run_at = COALESCE(%s, next_run_at),
                enabled = %s,
                last_executed_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = %s AND enabled AND next_run_at = %s
            RETURNING *
            """,
            (next_run_at, next_run_at is not None, schedule_id, due_at),
        )
        return to_model(Schedule.from_row, row)

    @staticmethod
    async def toggle_schedule(schedule_id: int, enabled: bool) -> Schedule | None:
        """Set `enabled` and return the updated schedule, or None when the id does not exist."""
        row = await PostgresDB.fetch_one(
            "UPDATE schedules SET enabled = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s RETURNING *",
            (enabled, schedule_id),
        )
        return to_model(Schedule.from_row, row)

    @staticmethod
    async def delete_schedule(schedule_id: int) -> bool:
        return await PostgresDB.execute("DELETE FROM schedules WHERE id = %s", (schedule_id,)) > 0

    @staticmethod
    async def delete_schedules_by_workflow(workflow_id: str) -> int:
        """Delete every schedule targeting the workflow; returns how many were deleted."""
        return await PostgresDB.execute("DELETE FROM schedules WHERE target_workflow_id = %s", (workflow_id,))
