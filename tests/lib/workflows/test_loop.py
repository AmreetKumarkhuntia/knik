"""The scheduler loop: polling through a database outage, recovering abandoned runs, and bounding its own runs."""

import asyncio
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

import psycopg
import psycopg_pool
import pytest

from lib.services.db import DatabaseUnavailable
from lib.workflows import loop


async def _run_polls(monkeypatch, results: list) -> MagicMock:
    """Runs one poll per item in results (an exception to raise or a schedule list); returns the logger."""
    scheduler = loop.CronScheduler()
    monkeypatch.setattr(scheduler.config, "scheduler_check_interval", 1)
    monkeypatch.setattr(scheduler, "_sleep", AsyncMock())
    scheduler._recovered = True

    async def list_schedules(**_kwargs):
        result = results.pop(0)
        if not results:
            scheduler._running = False
        if isinstance(result, Exception):
            raise result
        return result

    logger = MagicMock()
    with (
        patch.object(loop.ScheduleDB, "list_schedules", side_effect=list_schedules),
        patch.object(scheduler, "_check_schedules", AsyncMock()),
        patch.object(loop, "logger", logger),
    ):
        scheduler._running = True
        await asyncio.wait_for(scheduler._poll_loop(), timeout=5)
    return logger


OUTAGES = [
    pytest.param(lambda: DatabaseUnavailable("down"), id="down-at-startup"),
    pytest.param(lambda: psycopg_pool.PoolTimeout("couldn't get a connection"), id="down-after-pool-opened"),
]


@pytest.mark.asyncio
@pytest.mark.parametrize("outage", OUTAGES)
async def test_outage_is_logged_once_and_recovery_is_reported(monkeypatch, outage):
    logger = await _run_polls(monkeypatch, [outage(), outage(), outage(), []])

    assert logger.warning.call_count == 1
    assert "paused" in logger.warning.call_args.args[0]
    assert logger.error.call_count == 0
    assert any("reachable again" in call.args[0] for call in logger.info.call_args_list)


@pytest.mark.asyncio
async def test_query_errors_are_still_logged_on_every_poll(monkeypatch):
    error = psycopg.errors.UndefinedColumn("no such column")
    logger = await _run_polls(monkeypatch, [error, error, []])

    assert logger.error.call_count == 2
    assert logger.warning.call_count == 0


@pytest.mark.asyncio
async def test_abandoned_executions_are_failed_on_the_first_poll_that_reaches_postgres(monkeypatch):
    scheduler = loop.CronScheduler()
    monkeypatch.setattr(scheduler, "_sleep", AsyncMock())
    polls = 0

    async def list_schedules(**_kwargs):
        nonlocal polls
        polls += 1
        if polls == 2:
            scheduler._running = False
        return []

    fail_stale = AsyncMock(side_effect=[DatabaseUnavailable("down"), 2])
    with (
        patch.object(loop.ExecutionDB, "fail_stale_executions", fail_stale),
        patch.object(loop.ScheduleDB, "list_schedules", side_effect=list_schedules),
    ):
        scheduler._running = True
        await asyncio.wait_for(scheduler._poll_loop(), timeout=5)

    # Postgres was down on the first poll; the next two reached it, and only the first of those swept.
    assert fail_stale.await_count == 2
    stale_after, error = fail_stale.await_args.args
    assert stale_after == scheduler.config.scheduler_stale_execution_seconds
    assert error == f"Abandoned: still running at worker startup, more than {stale_after}s after it started"


class GatedEngine:
    """Runs hold until released, and the engine records the most it saw running at once."""

    def __init__(self) -> None:
        self.release = asyncio.Event()
        self.running = 0
        self.most_running = 0
        self.finished = 0

    async def execute_workflow(self, _workflow):
        self.running += 1
        self.most_running = max(self.most_running, self.running)
        try:
            await self.release.wait()
        finally:
            self.running -= 1
        self.finished += 1


@pytest.mark.asyncio
async def test_scheduled_runs_wait_for_a_free_slot(monkeypatch):
    monkeypatch.setenv("KNIK_SCHEDULER_MAX_CONCURRENT", "2")
    engine = GatedEngine()
    scheduler = loop.CronScheduler(engine)  # type: ignore[arg-type]
    monkeypatch.setattr(loop.WorkflowDB, "get_workflow", AsyncMock(return_value=SimpleNamespace(name="w")))

    runs = [asyncio.create_task(scheduler._trigger_workflow("w")) for _ in range(5)]
    await asyncio.sleep(0.05)
    assert engine.running == 2

    engine.release.set()
    await asyncio.wait_for(asyncio.gather(*runs), timeout=5)
    assert (engine.most_running, engine.finished) == (2, 5)


@pytest.mark.asyncio
async def test_stop_gives_up_on_a_run_that_will_not_finish(monkeypatch):
    monkeypatch.setattr(loop, "STOP_TIMEOUT", 0.1)
    scheduler = loop.CronScheduler()
    scheduler._running = True
    stubborn_done = asyncio.Event()

    async def stubborn():
        try:
            await asyncio.Event().wait()
        except asyncio.CancelledError:
            await stubborn_done.wait()

    run = asyncio.create_task(stubborn())
    scheduler._runs.add(run)
    await asyncio.sleep(0)
    logger = MagicMock()

    with patch.object(loop, "logger", logger):
        await asyncio.wait_for(scheduler.stop(), timeout=5)

    assert not run.done()
    assert "1 cancelled run(s) still not recorded" in logger.warning.call_args.args[0]
    stubborn_done.set()
    await run
