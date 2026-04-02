"""Bot command system - registry, dispatcher, and handler registration."""

from __future__ import annotations

from typing import TYPE_CHECKING

from .handlers import (
    handle_help,
    handle_model,
    handle_new,
    handle_provider,
    handle_resume,
    handle_sessions,
    handle_status,
)
from .registry import BotCommandDispatcher, BotCommandRegistry


if TYPE_CHECKING:
    from lib.commands.service import CommandService


def create_command_system(command_service: CommandService) -> tuple[BotCommandRegistry, BotCommandDispatcher]:
    registry = BotCommandRegistry()

    registry.register("new", "Start a fresh conversation", handle_new)
    registry.register("resume", "Resume a previous conversation", handle_resume)
    registry.register("sessions", "List recent conversations", handle_sessions)
    registry.register("model", "Show or switch AI model", handle_model)
    registry.register("provider", "Show or switch AI provider", handle_provider)
    registry.register("status", "Show current configuration", handle_status)
    registry.register("help", "Show available commands", handle_help)

    dispatcher = BotCommandDispatcher(registry, command_service)
    return registry, dispatcher


__all__ = [
    "BotCommandDispatcher",
    "BotCommandRegistry",
    "create_command_system",
]
