"""The worker runs one Scheduler, with every tool for AI nodes, from startup until SIGTERM."""

import asyncio
import os
import signal
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import pytest

from lib.core.config import Config
from lib.services.db import DatabaseUnavailable
from worker import app as app_mod


pytestmark = pytest.mark.asyncio


@pytest.fixture
def scheduler(monkeypatch) -> MagicMock:
    """Scheduler as the worker sees it; each WorkerApp gets this one and the kwargs are recorded."""
    scheduler = MagicMock()
    scheduler.stop = AsyncMock()
    scheduler.created_with = []

    def make_scheduler(**kwargs):
        scheduler.created_with.append(kwargs)
        return scheduler

    monkeypatch.setattr(app_mod, "Scheduler", make_scheduler)
    return scheduler


@pytest.fixture
def database(monkeypatch) -> SimpleNamespace:
    database = SimpleNamespace(initialize=AsyncMock(), close=AsyncMock())
    monkeypatch.setattr(app_mod, "PostgresDB", database)
    monkeypatch.setattr(app_mod, "SettingsDB", SimpleNamespace(get_all=AsyncMock(return_value={})))
    return database


async def _run_until_sigterm(worker: app_mod.WorkerApp, scheduler: MagicMock) -> None:
    task = asyncio.create_task(worker.run())
    # start() runs after the signal handlers are installed, so SIGTERM is safe to send from then on.
    for _ in range(100):
        if scheduler.start.called or task.done():
            break
        await asyncio.sleep(0.01)
    assert scheduler.start.called, "the worker never started the scheduler"
    os.kill(os.getpid(), signal.SIGTERM)
    await asyncio.wait_for(task, timeout=5)


async def test_worker_builds_the_scheduler_with_the_tool_factory(scheduler, database):
    app_mod.WorkerApp()

    assert scheduler.created_with == [{"ai_client_factory": app_mod.build_workflow_client}]


async def test_worker_starts_the_scheduler_and_stops_it_on_sigterm(scheduler, database):
    await _run_until_sigterm(app_mod.WorkerApp(), scheduler)

    database.initialize.assert_awaited_once_with()
    scheduler.start.assert_called_once_with()
    scheduler.stop.assert_awaited_once_with()
    database.close.assert_awaited_once_with()


async def test_worker_runs_with_the_stored_settings_over_the_env_ones(scheduler, database, monkeypatch):
    stored = {"ai_provider": "mock", "ai_model": "mock-model"}
    monkeypatch.setattr(app_mod, "SettingsDB", SimpleNamespace(get_all=AsyncMock(return_value=stored)))
    worker = app_mod.WorkerApp()

    await _run_until_sigterm(worker, scheduler)

    assert (worker.config.ai_provider, worker.config.ai_model) == ("mock", "mock-model")
    assert Config.current() is worker.config


async def test_worker_keeps_running_while_postgres_is_down(scheduler, database):
    database.initialize.side_effect = DatabaseUnavailable("down")

    await _run_until_sigterm(app_mod.WorkerApp(), scheduler)

    scheduler.start.assert_called_once_with()
    scheduler.stop.assert_awaited_once_with()


async def test_worker_closes_the_pool_only_once_the_scheduler_has_stopped(scheduler, database):
    order = []
    scheduler.stop.side_effect = lambda: order.append("scheduler stopped")
    database.close.side_effect = lambda: order.append("pool closed")

    await _run_until_sigterm(app_mod.WorkerApp(), scheduler)

    # Cancelled runs record their failure through the pool, so it must outlive them.
    assert order == ["scheduler stopped", "pool closed"]
