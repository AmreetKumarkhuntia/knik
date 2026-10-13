"""Bot command system: the shared commands plus the bot's own /new wording, /revoke and /help."""

from __future__ import annotations

from functools import partial
from typing import TYPE_CHECKING

from imports import register_shared_commands

from .handlers import handle_help, handle_new, handle_revoke
from .registry import BotCommandDispatcher, BotCommandRegistry


if TYPE_CHECKING:
    from bot.user_client_manager import UserClientManager
    from imports import CommandService


def create_command_system(
    command_service: CommandService, user_clients: UserClientManager
) -> tuple[BotCommandRegistry, BotCommandDispatcher]:
    registry = BotCommandRegistry()

    register_shared_commands(registry)
    registry.register("new", "Start a fresh conversation", partial(handle_new, user_clients=user_clients))
    registry.register("revoke", "Revoke all tool approvals", partial(handle_revoke, user_clients=user_clients))
    registry.register("help", "Show available commands", handle_help)

    dispatcher = BotCommandDispatcher(registry, command_service)
    return registry, dispatcher


__all__ = [
    "BotCommandDispatcher",
    "BotCommandRegistry",
    "create_command_system",
]
