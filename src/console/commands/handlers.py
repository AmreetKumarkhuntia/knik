"""The console's own command handlers; the shared ones come from the library."""

from __future__ import annotations

from typing import TYPE_CHECKING

from imports import CommandResult


if TYPE_CHECKING:
    from imports import CommandService


HELP_MESSAGE = (
    "Shared commands:\n\n"
    "  /new - Start a fresh conversation\n"
    "  /resume [id|#number] - Resume a previous conversation\n"
    "  /sessions [page] - List recent conversations\n"
    "  /model [name] - Show current or switch AI model\n"
    "  /provider [name] - Show current or switch AI provider\n"
    "  /status - Show current configuration\n"
    "  /help - Show this message\n\n"
    "Console commands:\n\n"
    "  /exit, /quit - Exit the application\n"
    "  /clear - Clear conversation history\n"
    "  /history - Show conversation history\n"
    "  /voice <name> - Change voice\n"
    "  /toggle-voice - Enable/disable voice output\n"
    "  /tools - Show available MCP tools\n"
    "  /agent <query> - Execute query using agent\n"
    "  /debug [on|off] - Toggle debug mode\n"
    "  /workflow list|run <id> - Manage workflows\n"
)


async def handle_help(command_service: CommandService, args: str, user_id: str) -> CommandResult:
    return CommandResult(success=True, message=HELP_MESSAGE)
