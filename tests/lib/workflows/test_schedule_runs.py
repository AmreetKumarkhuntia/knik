"""The schedule loop against a real database: each due occurrence runs once, and every run it starts is recorded."""

import asyncio
from collections.abc import Awaitable, Callable
from datetime import UTC, datetime, timedelta

import pytest

from lib.services.db import PostgresDB, Schedule, ScheduleDB, Workflow, WorkflowDB
from lib.workflows import schedule_service
from lib.workflows.engine import WorkflowEngine
from lib.workflows.loop import CronScheduler
from tests.db_support import requires_db


pytestmark = [requires_db, pytest.mark.asyncio]


def _sleep_definition(seconds: float) -> dict:
    return {
        "nodes": {"wait": {"type": "FunctionExecutionNode", "function": "sleep", "params": {"seconds": seconds}}},
        "connections": [],
    }


async def _workflow(workflow_id: str = "w1", seconds: float = 0) -> Workflow:
    workflow = Workflow(id=workflow_id, name=workflow_id, definition=_sleep_definition(seconds))
    await WorkflowDB.create_workflow(workflow)
    return workflow


async def _schedule(next_run_at: datetime, recurrence_seconds: int | None, timezone: str = "UTC") -> int:
    return await ScheduleDB.create_schedule(
        Schedule(
            id=0,
            target_workflow_id="w1",
            timezone=timezone,
            schedule_description="test",
            next_run_at=next_run_at,
            recurrence_seconds=recurrence_seconds,
        )
    )


async def _get_schedule(schedule_id: int) -> Schedule:
    [schedule] = [s for s in await ScheduleDB.list_schedules() if s.id == schedule_id]
    return schedule


async def _executions() -> list[dict]:
    return await PostgresDB.fetch_all("SELECT status, error_message FROM executions ORDER BY id")


async def _poll(scheduler: CronScheduler, schedules: list[Schedule] | None = None) -> None:
    """One poll, then wait for the runs it started."""
    await scheduler._check_schedules(schedules)
    await asyncio.gather(*scheduler._runs)


async def _eventually(condition: Callable[[], Awaitable[object]], timeout: float = 10) -> None:
    async with asyncio.timeout(timeout):
        while not await condition():
            await asyncio.sleep(0.05)


async def test_a_one_shot_schedule_fires_once_and_is_then_disabled(db):
    await _workflow()
    created = await schedule_service.create_schedule("w1", "in 2 minutes")
    assert created["recurrence_seconds"] is None
    await PostgresDB.execute("UPDATE schedules SET next_run_at = now() - interval '1 second'")
    [due] = await ScheduleDB.list_schedules()

    scheduler = CronScheduler(WorkflowEngine())
    for _ in range(4):
        await _poll(scheduler)

    assert await _executions() == [{"status": "success", "error_message": None}]
    schedule = await _get_schedule(created["schedule_id"])
    assert schedule.enabled is False
    assert schedule.next_run_at == due.next_run_at
    assert schedule.last_executed_at is not None


async def test_two_schedulers_polling_the_same_due_schedule_run_it_once(db):
    await _workflow()
    due = datetime.now(UTC) - timedelta(seconds=1)
    schedule_id = await _schedule(due, recurrence_seconds=300)
    # Both have read the schedule as due before either claims it.
    seen = await ScheduleDB.list_schedules(enabled_only=True)
    first, second = CronScheduler(WorkflowEngine()), CronScheduler(WorkflowEngine())

    await asyncio.gather(_poll(first, list(seen)), _poll(second, list(seen)))

    assert await _executions() == [{"status": "success", "error_message": None}]
    schedule = await _get_schedule(schedule_id)
    assert schedule.enabled is True
    assert schedule.next_run_at == due + timedelta(seconds=300)


async def test_a_recurring_schedule_does_not_drift_and_a_long_outage_fires_it_once(db):
    await _workflow()
    due = datetime.now(UTC).replace(microsecond=0) - timedelta(minutes=17)
    schedule_id = await _schedule(due, recurrence_seconds=300)

    scheduler = CronScheduler(WorkflowEngine())
    for _ in range(3):
        await _poll(scheduler)

    assert len(await _executions()) == 1
    schedule = await _get_schedule(schedule_id)
    assert schedule.next_run_at == due + timedelta(minutes=20)
    assert schedule.enabled is True


async def test_a_weekly_schedule_keeps_its_weekday_and_local_time(db):
    await _workflow()
    created = await schedule_service.create_schedule("w1", "every Monday at 2pm", "Asia/Kolkata")
    assert created["recurrence_seconds"] == 604800
    await PostgresDB.execute("UPDATE schedules SET next_run_at = next_run_at - interval '7 days'")

    await _poll(CronScheduler(WorkflowEngine()))

    assert len(await _executions()) == 1
    schedule = await _get_schedule(created["schedule_id"])
    assert schedule.next_run_at == datetime.fromisoformat(created["next_run_at"])
    assert schedule.enabled is True


async def test_a_cancelled_execution_is_recorded_as_failed(db):
    workflow = await _workflow(seconds=30)
    run = asyncio.create_task(WorkflowEngine().execute_workflow(workflow))
    await _eventually(lambda: PostgresDB.fetch_val("SELECT count(*) FROM executions WHERE status = 'running'"))

    run.cancel()
    with pytest.raises(asyncio.CancelledError):
        await run

    assert await _executions() == [{"status": "failed", "error_message": "cancelled"}]


async def test_stop_cancels_an_in_flight_scheduled_run_and_records_it(db):
    await _workflow(seconds=30)
    schedule_id = await _schedule(datetime.now(UTC) - timedelta(seconds=1), recurrence_seconds=3600)
    scheduler = CronScheduler(WorkflowEngine())
    scheduler.config.scheduler_check_interval = 1

    scheduler.start()
    await _eventually(lambda: PostgresDB.fetch_val("SELECT count(*) FROM executions WHERE status = 'running'"))
    [run] = scheduler._runs

    await asyncio.wait_for(scheduler.stop(), timeout=10)

    assert run.done()
    assert scheduler._task is not None and scheduler._task.done()
    assert await _executions() == [{"status": "failed", "error_message": "cancelled"}]
    assert (await _get_schedule(schedule_id)).last_executed_at is not None


async def test_executions_left_running_by_a_stopped_worker_are_failed_at_startup(db):
    await _workflow()
    await PostgresDB.execute(
        "INSERT INTO executions (workflow_id, status, started_at) VALUES "
        "('w1', 'running', now() - interval '2 hours'), "
        "('w1', 'running', now() - interval '1 minute'), "
        "('w1', 'success', now() - interval '2 hours')"
    )
    scheduler = CronScheduler(WorkflowEngine())
    scheduler.config.scheduler_stale_execution_seconds = 3600

    await scheduler._fail_abandoned_executions()

    rows = await PostgresDB.fetch_all("SELECT status, error_message, completed_at FROM executions ORDER BY id")
    abandoned, recent, finished = rows
    assert abandoned["status"] == "failed"
    assert abandoned["completed_at"] is not None
    assert "3600" in abandoned["error_message"]
    assert (recent["status"], recent["error_message"]) == ("running", None)
    assert (finished["status"], finished["error_message"]) == ("success", None)
