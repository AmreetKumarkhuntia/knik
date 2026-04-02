"""Console command registry and dispatch system."""

from __future__ import annotations

import asyncio
import logging
from collections.abc import Callable
from dataclasses import dataclass
from typing import TYPE_CHECKING

from lib.commands.models import CommandDefinition, CommandResult


if TYPE_CHECKING:
    from lib.commands.service import CommandService

logger = logging.getLogger(__name__)

CommandHandler = Callable[..., CommandResult]

CONSOLE_USER_ID = "console_user"


@dataclass
class RegisteredCommand:
    definition: CommandDefinition
    handler: CommandHandler


class ConsoleCommandRegistry:
    def __init__(self) -> None:
        self._commands: dict[str, RegisteredCommand] = {}

    def register(self, name: str, description: str, handler: CommandHandler) -> None:
        self._commands[name.lower()] = RegisteredCommand(
            definition=CommandDefinition(name=name.lower(), description=description),
            handler=handler,
        )

    def get(self, name: str) -> RegisteredCommand | None:
        return self._commands.get(name.lower())

    def get_definitions(self) -> list[CommandDefinition]:
        return [cmd.definition for cmd in self._commands.values()]

    def list_commands(self) -> list[str]:
        return list(self._commands.keys())


class ConsoleCommandDispatcher:
    def __init__(self, registry: ConsoleCommandRegistry, command_service: CommandService) -> None:
        self._registry = registry
        self._service = command_service

    def try_dispatch(self, text: str) -> CommandResult | None:
        """Dispatch a command string. Returns None if not a known command."""
        text = text.strip()
        if not text.startswith("/"):
            return None

        parts = text[1:].split(maxsplit=1)
        if not parts:
            return None

        command_name = parts[0].lower()
        args = parts[1].strip() if len(parts) > 1 else ""

        registered = self._registry.get(command_name)
        if registered is None:
            return None

        logger.info("Dispatching command: /%s (args: %s)", command_name, args[:50])

        try:
            result = registered.handler(
                command_service=self._service,
                args=args,
                user_id=CONSOLE_USER_ID,
            )
            # handlers may return a coroutine if accidentally defined async
            if asyncio.iscoroutine(result):
                result = asyncio.run(result)
            return result
        except Exception as e:
            logger.error("Command handler error for /%s: %s", command_name, e)
            return CommandResult(success=False, message=f"Error executing command: {e}")

    def get_help_text(self, command_prefix: str = "/") -> str:
        lines = ["Available commands:", ""]
        for defn in self._registry.get_definitions():
            lines.append(f"  {command_prefix}{defn.name} - {defn.description}")
        return "\n".join(lines)
