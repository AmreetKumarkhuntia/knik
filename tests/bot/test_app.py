"""Tests for BotApp wiring, with a fake transport and no database, AI provider or Telegram."""

import asyncio
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from bot.app import BotApp
from bot.config import BotConfig
from lib.services.db.connection import DatabaseUnavailable
from lib.services.telegram.models import IncomingMessage


EXPECTED_COMMANDS = ["new", "resume", "sessions", "model", "provider", "status", "revoke", "help"]


@pytest.fixture
def db():
    with (
        patch("bot.app.PostgresDB") as db,
        patch("bot.app.cleanup_all_tools"),
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


@pytest.mark.asyncio
async def test_a_message_handler_failure_is_logged(app, transport):
    task = await _start(app, transport)
    app._message_handler.handle = AsyncMock(side_effect=RuntimeError("boom"))

    with patch("bot.app.logger") as logger:
        await transport.on_message(IncomingMessage(chat_id="1", text="hi", sender_id="42", message_id="m1"))
        await asyncio.sleep(0.01)

    assert "boom" in logger.error.call_args.args[0]
    assert "m1" in logger.error.call_args.args[0]
    await _stop(app, task)


@pytest.mark.asyncio
async def test_a_disabled_bot_does_not_start(db, transport):
    config = BotConfig()
    config.bot_enabled = False

    await asyncio.wait_for(BotApp(config, transport=transport).run(), timeout=5)

    assert transport.on_message is None
    db.initialize.assert_not_awaited()


@pytest.mark.asyncio
async def test_shutdown_cleans_up_every_tool_registry(app, transport):
    with patch("bot.app.cleanup_all_tools") as cleanup:
        task = await _start(app, transport)
        await _stop(app, task)

    cleanup.assert_called_once_with()


@pytest.mark.asyncio
async def test_startup_builds_no_ai_client(app, transport):
    with patch("bot.user_client_manager.build_client") as build_client:
        task = await _start(app, transport)
        await _stop(app, task)

    build_client.assert_not_called()


@pytest.mark.asyncio
async def test_a_command_acts_on_the_senders_own_client(app, transport):
    config = BotConfig()
    config.ai_provider = "mock"
    app.config = config
    task = await _start(app, transport)

    await transport.on_message(IncomingMessage(chat_id="1", text="/status", sender_id="42"))
    for _ in range(200):
        if transport.messages:
            break
        await asyncio.sleep(0.01)

    user_id = app._user_identity.get_user_id_for_sender("42")
    client = app._user_client_manager.get(user_id)
    assert client is not None
    assert transport.messages[0].text.startswith(f"Status:\n  Provider: mock\n  Model:    {client.get_model_name()}")
    # Consent prompts and the replies to them meet in one broker.
    assert app._user_client_manager._consent_broker is app._message_handler._consent

    await _stop(app, task)


@pytest.mark.asyncio
async def test_a_tool_waits_for_its_users_consent_reply(app, transport):
    config = BotConfig()
    config.ai_provider = "mock"
    app.config = config
    task = await _start(app, transport)

    user_id = (await app._user_identity.resolve(IncomingMessage(chat_id="1", text="hi", sender_id="42"))).user_id
    app._user_client_manager.set_chat_context(user_id, "1")
    registry = (await app._user_client_manager.get_or_create(user_id)).tool_registry
    registry._implementations["run_shell_command"] = lambda **kwargs: f"ran {kwargs['command']}"

    tool_call = asyncio.create_task(asyncio.to_thread(registry.execute_tool, "run_shell_command", command="ls"))
    for _ in range(200):
        if transport.messages:
            break
        await asyncio.sleep(0.01)
    assert transport.messages[0].text == "Allow run_shell_command(command='ls')? Reply yes (y) / yes all (ya) / no"

    # Someone else in the chat cannot answer for the user; the user's own reply can.
    app._message_handler._process_message = AsyncMock()
    await transport.on_message(IncomingMessage(chat_id="1", text="y", sender_id="43", message_id="m1"))
    await asyncio.sleep(0.05)
    assert not tool_call.done()
    await transport.on_message(IncomingMessage(chat_id="1", text="y", sender_id="42", message_id="m2"))

    assert await asyncio.wait_for(tool_call, timeout=5) == "ran ls"
    assert transport.messages[-1].text == "Approved."

    await _stop(app, task)
