"""Tests for BotApp wiring, with a fake transport and no database, AI provider or Telegram."""

import asyncio
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

import imports
from bot.app import BotApp
from bot.config import BotConfig
from lib.services.db.connection import DatabaseUnavailable


EXPECTED_COMMANDS = ["new", "resume", "sessions", "model", "provider", "status", "revoke", "help"]


@pytest.fixture
def db():
    lazy_names = {
        "AIClient": MagicMock(return_value=MagicMock(provider_name="mock")),
        "MCPServerRegistry": MagicMock(),
        "register_all_tools": MagicMock(),
    }
    with (
        patch("bot.app.PostgresDB") as db,
        patch("bot.app.BaseTool"),
        patch.dict(imports.__dict__, lazy_names),
    ):
        db.initialize = AsyncMock()
        db.close = AsyncMock()
        yield db


@pytest.fixture
def app(db, transport):
    return BotApp(BotConfig(), transport=transport)


async def _start(app, transport) -> asyncio.Task:
    task = asyncio.create_task(app.run())
    for _ in range(200):
        if transport.on_message is not None:
            return task
        await asyncio.sleep(0.01)
    raise AssertionError("transport was never started")


async def _stop(app, task) -> None:
    app._stop_event.set()
    await asyncio.wait_for(task, timeout=5)


@pytest.mark.asyncio
async def test_run_registers_commands_starts_and_stops_transport(app, db, transport):
    task = await _start(app, transport)

    assert [c.name for c in transport.commands] == EXPECTED_COMMANDS
    assert all(c.description for c in transport.commands)

    await _stop(app, task)

    assert transport.stopped
    db.close.assert_awaited_once()


@pytest.mark.asyncio
async def test_failed_start_still_stops_transport(app, transport):
    transport.start = AsyncMock(side_effect=RuntimeError("token rejected"))

    with pytest.raises(RuntimeError, match="token rejected"):
        await asyncio.wait_for(app.run(), timeout=5)

    assert transport.stopped


@pytest.mark.asyncio
async def test_bot_starts_without_postgres(app, db, transport):
    db.initialize.side_effect = DatabaseUnavailable("Postgres unavailable")

    task = await _start(app, transport)
    await _stop(app, task)

    assert transport.stopped


@pytest.mark.asyncio
async def test_incoming_message_is_handed_to_the_message_handler(app, transport):
    task = await _start(app, transport)

    handle = AsyncMock()
    app._message_handler.handle = handle
    message = MagicMock()
    await transport.on_message(message)
    await asyncio.sleep(0)

    handle.assert_awaited_once_with(message)

    await _stop(app, task)
