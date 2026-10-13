"""The bot's command registry and dispatcher: the shared ones plus the /start alias, the Telegram menu and @mentions."""

from __future__ import annotations

from typing import TYPE_CHECKING

from imports import BotCommand, CommandDispatcher, CommandRegistry


if TYPE_CHECKING:
    from bot.user_identity import UserIdentityManager
    from imports import CommandResult, IncomingMessage


ALIASES: dict[str, str] = {
    "start": "new",
}


class BotCommandRegistry(CommandRegistry):
    def __init__(self) -> None:
        super().__init__(aliases=ALIASES)

    def get_bot_commands(self) -> list[BotCommand]:
        return [BotCommand(name=d.name, description=d.description) for d in self.get_definitions()]


class BotCommandDispatcher(CommandDispatcher):
    def parse(self, text: str) -> tuple[str, str] | None:
        parsed = super().parse(text)
        if parsed is None:
            return None
        command_name, args = parsed
        # In group chats Telegram appends the bot's username: /status@knik_bot.
        return command_name.split("@")[0], args

    async def try_dispatch(
        self,
        incoming: IncomingMessage,
        user_identity: UserIdentityManager,
    ) -> CommandResult | None:
        text = incoming.text or ""
        # A command acts on its sender's session and AI client, so one without a sender is not run as a command.
        if incoming.sender_id is None or not self.handles(text):
            return None
        # resolve() registers a sender seen for the first time, so a first-message /resume or /model sticks.
        return await self.dispatch(text, user_identity.resolve(incoming).user_id)
