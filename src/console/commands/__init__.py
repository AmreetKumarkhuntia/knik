"""Console command system: the shared commands plus the console's /help."""

from __future__ import annotations

from typing import TYPE_CHECKING

from imports import CommandRegistry, register_shared_commands

from .handlers import handle_help
from .registry import ConsoleCommandDispatcher


if TYPE_CHECKING:
    from imports import CommandService


def create_command_system(command_service: CommandService) -> tuple[CommandRegistry, ConsoleCommandDispatcher]:
    registry = CommandRegistry()

    register_shared_commands(registry)
    registry.register("help", "Show available commands", handle_help)

    dispatcher = ConsoleCommandDispatcher(registry, command_service)
    return registry, dispatcher


__all__ = [
    "ConsoleCommandDispatcher",
    "create_command_system",
]
