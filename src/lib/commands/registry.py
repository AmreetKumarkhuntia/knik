"""Command registry and dispatcher shared by the apps; each app subclasses them only for what it does differently."""

from __future__ import annotations

from collections.abc import Awaitable, Mapping
from dataclasses import dataclass
from typing import TYPE_CHECKING, Protocol

from lib.utils.printer import printer

from .models import CommandDefinition, CommandResult


if TYPE_CHECKING:
    from .service import CommandService


class CommandHandler(Protocol):
    def __call__(self, command_service: CommandService, args: str, user_id: str) -> Awaitable[CommandResult]: ...


@dataclass
class RegisteredCommand:
    definition: CommandDefinition
    handler: CommandHandler


class CommandRegistry:
    def __init__(self, aliases: Mapping[str, str] | None = None) -> None:
        self._commands: dict[str, RegisteredCommand] = {}
        self._aliases = {alias.lower(): name.lower() for alias, name in (aliases or {}).items()}

    def register(self, name: str, description: str, handler: CommandHandler) -> None:
        """Registering a name again replaces its command but keeps its place in the list."""
        self._commands[name.lower()] = RegisteredCommand(
            definition=CommandDefinition(name=name.lower(), description=description),
            handler=handler,
        )

    def get(self, name: str) -> RegisteredCommand | None:
        resolved = self._aliases.get(name.lower(), name.lower())
        return self._commands.get(resolved)

    def get_definitions(self) -> list[CommandDefinition]:
        return [cmd.definition for cmd in self._commands.values()]

    def list_commands(self) -> list[str]:
        return list(self._commands.keys())


class CommandDispatcher:
    def __init__(self, registry: CommandRegistry, command_service: CommandService) -> None:
        self._registry = registry
        self._service = command_service

    @property
    def registry(self) -> CommandRegistry:
        return self._registry

    def parse(self, text: str) -> tuple[str, str] | None:
        """The lower-case command name and its arguments, or None when the text is not a slash command."""
        text = text.strip()
        if not text.startswith("/"):
            return None
        parts = text[1:].split(maxsplit=1)
        if not parts:
            return None
        return parts[0].lower(), parts[1].strip() if len(parts) > 1 else ""

    def handles(self, text: str) -> bool:
        parsed = self.parse(text)
        return parsed is not None and self._registry.get(parsed[0]) is not None

    async def dispatch(self, text: str, user_id: str) -> CommandResult | None:
        """None when the text is not a registered command, so the app can treat it another way.

        A handler that raises becomes a failed result, so one broken command never takes the app down.
        """
        parsed = self.parse(text)
        if parsed is None:
            return None
        command_name, args = parsed
        registered = self._registry.get(command_name)
        if registered is None:
            return None

        printer.info(f"Dispatching command: /{command_name} (args: {args[:50]})")
        try:
            return await registered.handler(command_service=self._service, args=args, user_id=user_id)
        except Exception as e:
            printer.error(f"Command handler error for /{command_name}: {e}")
            return CommandResult(success=False, message=f"Error executing command: {e}")
