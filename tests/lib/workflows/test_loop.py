"""The scheduler loop keeps polling through a database outage and reports it once."""

import asyncio
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
    monkeypatch.setattr(loop.asyncio, "sleep", AsyncMock())

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
