"""Tests for the bot command registry and dispatcher."""

from unittest.mock import AsyncMock, MagicMock

import pytest

from bot.commands import create_command_system
from bot.user_identity import UserIdentityManager
from lib.commands.models import CommandResult
from lib.services.telegram.models import BotCommand, IncomingMessage


def _system():
    return create_command_system(MagicMock(), MagicMock())


def test_bot_commands_mirror_registered_definitions():
    registry, _ = _system()

    commands = registry.get_bot_commands()

    assert all(isinstance(c, BotCommand) for c in commands)
    assert [(c.name, c.description) for c in commands] == [(d.name, d.description) for d in registry.get_definitions()]


def test_the_menu_keeps_the_shared_commands_first_and_its_own_wording():
    registry, _ = _system()

    assert [(c.name, c.description) for c in registry.get_bot_commands()] == [
        ("new", "Start a fresh conversation"),
        ("resume", "Resume a previous conversation"),
        ("sessions", "List recent conversations"),
        ("model", "Show or switch AI model"),
        ("provider", "Show or switch AI provider"),
        ("status", "Show current configuration"),
        ("revoke", "Revoke all tool approvals"),
        ("help", "Show available commands"),
    ]


@pytest.mark.asyncio
async def test_dispatch_resolves_user_id_from_sender():
    registry, dispatcher = _system()
    handler = AsyncMock(return_value=CommandResult(success=True, message="ok"))
    registry.register("ping", "Ping", handler)

    identity = UserIdentityManager()
    message = IncomingMessage(chat_id="1", text="/ping@knik_bot now", sender_id="42")
    user_id = (await identity.resolve(message)).user_id

    result = await dispatcher.try_dispatch(message, identity)

    assert result is not None and result.message == "ok"
    assert handler.await_args.kwargs["args"] == "now"
    assert handler.await_args.kwargs["user_id"] == user_id


def test_start_is_an_alias_of_new():
    registry, _ = _system()

    assert registry.get("start") is registry.get("new")


@pytest.mark.asyncio
async def test_unknown_command_is_not_dispatched():
    _, dispatcher = _system()

    message = IncomingMessage(chat_id="1", text="/nope", sender_id="42")

    assert await dispatcher.try_dispatch(message, UserIdentityManager()) is None


@pytest.mark.asyncio
async def test_an_unknown_command_does_not_register_its_sender():
    _, dispatcher = _system()
    identity = UserIdentityManager()

    await dispatcher.try_dispatch(IncomingMessage(chat_id="1", text="/nope", sender_id="42"), identity)

    assert identity.get_user_id_for_sender("42") is None
