"""The bot's own command handlers; the shared ones come from the library."""

from __future__ import annotations

from typing import TYPE_CHECKING

from imports import CommandResult


if TYPE_CHECKING:
    from bot.user_client_manager import UserClientManager
    from imports import CommandService


WELCOME_MESSAGE = (
    "New session started.\n\n"
    "Available commands:\n"
    "  /new - Start fresh conversation\n"
    "  /resume <id> - Resume a conversation\n"
    "  /sessions - List recent conversations\n"
    "  /model [name] - Show or switch model\n"
    "  /provider [name] - Show or switch provider\n"
    "  /status - Current configuration\n"
    "  /revoke - Revoke all tool approvals\n"
    "  /help - Show this message"
)

HELP_MESSAGE = (
    "Available commands:\n\n"
    "  /new - Start a fresh conversation\n"
    "  /resume [id|#number] - Resume a previous conversation\n"
    "  /sessions - List recent conversations\n"
    "  /model [name] - Show current or switch AI model\n"
    "  /provider [name] - Show current or switch AI provider\n"
    "  /status - Show current configuration\n"
    "  /revoke - Revoke all tool approvals\n"
    "  /help - Show this message\n"
)


async def handle_new(
    command_service: CommandService, args: str, user_id: str, *, user_clients: UserClientManager
) -> CommandResult:
    result = await command_service.new_session(user_id)
    if not result.success:
        return result
    # A fresh conversation starts with fresh tools: an open browser session is closed and "yes all" approvals go.
    user_clients.cleanup_tools(user_id)
    return CommandResult(success=True, message=WELCOME_MESSAGE)


async def handle_revoke(
    command_service: CommandService, args: str, user_id: str, *, user_clients: UserClientManager
) -> CommandResult:
    user_clients.revoke_tool_consent(user_id)
    return CommandResult(
        success=True,
        message="All tool approvals revoked. Each tool will ask for permission again.",
    )


async def handle_help(command_service: CommandService, args: str, user_id: str) -> CommandResult:
    return CommandResult(success=True, message=HELP_MESSAGE)
