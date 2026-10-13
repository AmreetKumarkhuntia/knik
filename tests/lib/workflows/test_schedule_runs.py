"""The schedule loop against a real database: each due occurrence runs once, on a worker with a free run slot, and every
run it starts is recorded."""

import asyncio
from collections.abc import Awaitable, Callable
from datetime import UTC, datetime, timedelta

import psycopg
import pytest

from lib.services.db import ExecutionDB, PostgresDB, Schedule, ScheduleDB, Workflow, WorkflowDB
from lib.workflows import schedule_service
from lib.workflows.engine import WorkflowEngine
from lib.workflows.loop import CronScheduler
from tests.db_support import DATABASE_URL, requires_db


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


async def _cancel_runs(*schedulers: CronScheduler) -> None:
    runs = [run for scheduler in schedulers for run in scheduler._runs]
    for run in runs:
        run.cancel()
    await asyncio.gather(*runs, return_exceptions=True)


async def test_a_worker_with_no_free_slot_leaves_due_occurrences_unclaimed(db, monkeypatch):
    monkeypatch.setenv("KNIK_SCHEDULER_MAX_CONCURRENT", "1")
    await _workflow(seconds=30)
    schedule_id = await _schedule(datetime.now(UTC) - timedelta(seconds=1), recurrence_seconds=1)
    scheduler = CronScheduler(WorkflowEngine())

    await scheduler._check_schedules()
    [slow] = scheduler._runs
    # 2.5s of polls while the slow run holds the only slot and the schedule falls due twice more.
    for _ in range(10):
        await asyncio.sleep(0.25)
        await scheduler._check_schedules()
        assert scheduler._runs == {slow}

    left_due = (await _get_schedule(schedule_id)).next_run_at
    assert left_due is not None and left_due <= datetime.now(UTC)
    assert await PostgresDB.fetch_val("SELECT count(*) FROM executions") == 1

    await _cancel_runs(scheduler)
    await scheduler._check_schedules()
    assert len(scheduler._runs) == 1
    await _cancel_runs(scheduler)


async def test_an_idle_worker_takes_the_occurrences_a_busy_worker_leaves(db, monkeypatch):
    await _workflow(seconds=30)
    await _schedule(datetime.now(UTC) - timedelta(seconds=1), recurrence_seconds=1)
    monkeypatch.setenv("KNIK_SCHEDULER_MAX_CONCURRENT", "1")
    busy = CronScheduler(WorkflowEngine())
    monkeypatch.setenv("KNIK_SCHEDULER_MAX_CONCURRENT", "10")
    idle = CronScheduler(WorkflowEngine())

    await busy._check_schedules()
    [slow] = busy._runs
    # Both read each listing and the busy worker always claims first; the schedule falls due twice more.
    for _ in range(10):
        await asyncio.sleep(0.25)
        seen = await ScheduleDB.list_schedules(enabled_only=True)
        await busy._check_schedules(list(seen))
        await idle._check_schedules(list(seen))

    assert busy._runs == {slow}
    assert len(idle._runs) >= 2
    await _cancel_runs(busy, idle)


async def test_a_cancelled_execution_is_recorded_as_failed(db):
    workflow = await _workflow(seconds=30)
    run = asyncio.create_task(WorkflowEngine().execute_workflow(workflow))
    await _eventually(lambda: PostgresDB.fetch_val("SELECT count(*) FROM executions WHERE status = 'running'"))

    run.cancel()
    with pytest.raises(asyncio.CancelledError):
        await run

    assert await _executions() == [{"status": "failed", "error_message": "cancelled"}]


async def test_a_run_cancelled_while_recording_a_node_failure_is_recorded_as_failed(db, monkeypatch):
    workflow = Workflow(
        id="w1",
        name="w1",
        definition={
            "nodes": {"boom": {"type": "FunctionExecutionNode", "code": "raise ValueError('boom')"}},
            "connections": [],
        },
    )
    await WorkflowDB.create_workflow(workflow)
    real_create_execution = ExecutionDB.create_execution
    async with await psycopg.AsyncConnection.connect(DATABASE_URL) as locker:

        async def create_and_lock(*args):
            # Another session holds the new row, so the engine's failure write waits on it like on a slow database.
            execution_id = await real_create_execution(*args)
            await locker.execute("SELECT id FROM executions WHERE id = %s FOR NO KEY UPDATE", (execution_id,))
            return execution_id

        monkeypatch.setattr(ExecutionDB, "create_execution", create_and_lock)
        run = asyncio.create_task(WorkflowEngine().execute_workflow(workflow))
        await _eventually(
            lambda: PostgresDB.fetch_val(
                "SELECT count(*) FROM pg_stat_activity WHERE datname = current_database() AND wait_event_type = 'Lock'"
            )
        )

        run.cancel()  # what CronScheduler.stop() does, and then it waits for the run
        await asyncio.wait({run}, timeout=0.5)
        done_while_the_write_waited = run.done()
        await locker.rollback()
        await asyncio.wait({run}, timeout=5)

    assert run.cancelled()
    assert await _executions() == [{"status": "failed", "error_message": "Node(s) failed: boom"}]
    assert not done_while_the_write_waited


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
