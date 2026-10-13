"""Schedules against a real database: one caller claims each due occurrence, and old rows get their recurrence."""

import asyncio
from datetime import UTC, datetime, timedelta

import pytest

from lib.services.db import PostgresDB, Schedule, ScheduleDB, Workflow, WorkflowDB
from tests.db_support import MIGRATIONS_DIR, requires_db


pytestmark = [requires_db, pytest.mark.asyncio]

DUE = datetime(2026, 1, 1, 9, 0, tzinfo=UTC)


async def _schedule(*, enabled: bool = True) -> int:
    await WorkflowDB.create_workflow(Workflow(id="w1", name="W1", definition={}))
    return await ScheduleDB.create_schedule(
        Schedule(id=0, target_workflow_id="w1", enabled=enabled, next_run_at=DUE, recurrence_seconds=3600)
    )


async def test_claiming_moves_a_recurring_schedule_on_and_only_once(db):
    schedule_id = await _schedule()

    claimed = await ScheduleDB.claim_due_run(schedule_id, DUE, DUE + timedelta(hours=1))

    assert claimed is not None
    assert (claimed.enabled, claimed.next_run_at) == (True, DUE + timedelta(hours=1))
    assert claimed.last_executed_at is not None
    assert await ScheduleDB.claim_due_run(schedule_id, DUE, DUE + timedelta(hours=1)) is None


async def test_claiming_a_one_shot_occurrence_disables_the_schedule(db):
    schedule_id = await _schedule()

    claimed = await ScheduleDB.claim_due_run(schedule_id, DUE, None)

    assert claimed is not None
    assert (claimed.enabled, claimed.next_run_at) == (False, DUE)
    assert claimed.last_executed_at is not None
    assert await ScheduleDB.claim_due_run(schedule_id, DUE, None) is None


async def test_a_disabled_changed_or_missing_schedule_cannot_be_claimed(db):
    disabled_id = await _schedule(enabled=False)
    assert await ScheduleDB.claim_due_run(disabled_id, DUE, None) is None

    assert await ScheduleDB.claim_due_run(disabled_id + 1, DUE, None) is None

    changed_id = await ScheduleDB.create_schedule(
        Schedule(id=0, target_workflow_id="w1", next_run_at=DUE + timedelta(days=1))
    )
    assert await ScheduleDB.claim_due_run(changed_id, DUE, None) is None
    [changed] = [s for s in await ScheduleDB.list_schedules() if s.id == changed_id]
    assert (changed.enabled, changed.last_executed_at) == (True, None)


async def test_concurrent_claims_of_one_occurrence_have_one_winner(db):
    schedule_id = await _schedule()

    results = await asyncio.gather(
        *(ScheduleDB.claim_due_run(schedule_id, DUE, DUE + timedelta(hours=1)) for _ in range(5))
    )

    assert sum(result is not None for result in results) == 1


async def test_the_backfill_migration_gives_weekday_and_everyday_schedules_their_recurrence(db):
    await WorkflowDB.create_workflow(Workflow(id="w1", name="W1", definition={}))
    stored = {
        "every Monday at 2pm": None,
        "Every friday at 17:00": None,
        "everyday at 9am": None,
        "in 5 minutes": None,
        "tomorrow at 3pm": None,
        "every sunday at noon": 1234,
    }
    for description, recurrence in stored.items():
        await ScheduleDB.create_schedule(
            Schedule(id=0, target_workflow_id="w1", schedule_description=description, recurrence_seconds=recurrence)
        )
    migration = (MIGRATIONS_DIR / "012_backfill_schedule_recurrence.sql").read_bytes()

    for _ in range(2):
        async with PostgresDB.get_connection() as conn:
            await conn.execute(migration)

        recurrences = {s.schedule_description: s.recurrence_seconds for s in await ScheduleDB.list_schedules()}
        assert recurrences == {
            "every Monday at 2pm": 604800,
            "Every friday at 17:00": 604800,
            "everyday at 9am": 86400,
            "in 5 minutes": None,
            "tomorrow at 3pm": None,
            "every sunday at noon": 1234,
        }
