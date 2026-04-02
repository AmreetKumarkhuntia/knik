"""Bot command registry and dispatch system."""

from __future__ import annotations

import logging
from collections.abc import Callable, Coroutine
from dataclasses import dataclass
from typing import TYPE_CHECKING, Any

from lib.commands.models import CommandDefinition, CommandResult
from lib.services.messaging_client.models import IncomingMessage


if TYPE_CHECKING:
    from apps.bot.user_identity import UserIdentityManager
    from lib.commands.service import CommandService

logger = logging.getLogger(__name__)

CommandHandler = Callable[..., Coroutine[Any, Any, CommandResult]]


@dataclass
class RegisteredCommand:
    definition: CommandDefinition
    handler: CommandHandler


ALIASES: dict[str, str] = {
    "start": "new",
}


class BotCommandRegistry:
    def __init__(self) -> None:
        self._commands: dict[str, RegisteredCommand] = {}

    def register(self, name: str, description: str, handler: CommandHandler) -> None:
        self._commands[name.lower()] = RegisteredCommand(
            definition=CommandDefinition(name=name.lower(), description=description),
            handler=handler,
        )

    def get(self, name: str) -> RegisteredCommand | None:
        resolved = ALIASES.get(name.lower(), name.lower())
        return self._commands.get(resolved)

    def get_definitions(self) -> list[CommandDefinition]:
        return [cmd.definition for cmd in self._commands.values()]

    def list_commands(self) -> list[str]:
        return list(self._commands.keys())


class BotCommandDispatcher:
    def __init__(self, registry: BotCommandRegistry, command_service: CommandService) -> None:
        self._registry = registry
        self._service = command_service

    async def try_dispatch(
        self,
        incoming: IncomingMessage,
        user_identity: UserIdentityManager,
    ) -> CommandResult | None:
        text = (incoming.text or "").strip()
        if not text.startswith("/"):
            return None

        parts = text[1:].split(maxsplit=1)
        if not parts:
            return None

        command_name = parts[0].lower().split("@")[0]
        args = parts[1].strip() if len(parts) > 1 else ""

        registered = self._registry.get(command_name)
        if registered is None:
            return None

        logger.info("Dispatching command: /%s (args: %s)", command_name, args[:50])

        try:
            return await registered.handler(
                command_service=self._service,
                args=args,
                user_id=user_identity.get_user_id_for_sender(
                    incoming.provider_name or "unknown",
                    incoming.sender_id,
                ),
            )
        except Exception as e:
            logger.error("Command handler error for /%s: %s", command_name, e)
            return CommandResult(success=False, message=f"Error executing command: {e}")
