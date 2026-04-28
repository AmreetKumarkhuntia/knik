"""Console command handler implementations."""

from __future__ import annotations

import asyncio
import logging
from typing import TYPE_CHECKING

from lib.commands.models import CommandResult


if TYPE_CHECKING:
    from lib.commands.service import CommandService

logger = logging.getLogger(__name__)


def handle_new(command_service: CommandService, args: str, user_id: str) -> CommandResult:
    return asyncio.run(command_service.new_session(user_id))


def handle_resume(command_service: CommandService, args: str, user_id: str) -> CommandResult:
    if not args:
        sessions = asyncio.run(command_service.list_sessions(limit=5))
        if not sessions:
            return CommandResult(success=True, message="No previous conversations found.")
        lines = ["Recent conversations:", ""]
        for i, s in enumerate(sessions, 1):
            title = s.title or "Untitled"
            updated = s.updated_at.strftime("%b %d %H:%M") if s.updated_at else "unknown"
            lines.append(f"  #{i} {title}")
            lines.append(f"     {updated} | {s.message_count} msgs")
            lines.append(f"     {s.conversation_id}")
            lines.append("")
        lines.append("Usage: /resume <id> or /resume #<number>")
        return CommandResult(success=True, message="\n".join(lines))

    return asyncio.run(command_service.resume_session(user_id, args))


def handle_sessions(command_service: CommandService, args: str, user_id: str) -> CommandResult:
    page_size = 5

    page = 1
    if args.strip():
        try:
            page = max(1, int(args.strip()))
        except ValueError:
            return CommandResult(success=False, message="Usage: /sessions [page]\nExample: /sessions 2")

    offset = (page - 1) * page_size
    sessions = asyncio.run(command_service.list_sessions(limit=page_size, offset=offset))

    if not sessions and page == 1:
        return CommandResult(success=True, message="No conversations found.")
    if not sessions:
        return CommandResult(success=True, message=f"No conversations on page {page}.")

    start_index = offset + 1
    lines = [f"Conversations (page {page}):", ""]
    for i, s in enumerate(sessions, start_index):
        title = s.title or "Untitled"
        updated = s.updated_at.strftime("%b %d %H:%M") if s.updated_at else "unknown"
        lines.append(f"  #{i} {title}")
        lines.append(f"     {updated} | {s.message_count} msgs")
        lines.append(f"     {s.conversation_id}")
        lines.append("")

    lines.append("/resume #<number> or /resume <id> to continue")
    if len(sessions) == page_size:
        lines.append(f"/sessions {page + 1} for next page")

    return CommandResult(success=True, message="\n".join(lines))


def handle_model(command_service: CommandService, args: str, user_id: str) -> CommandResult:
    return asyncio.run(command_service.switch_model(args))


def handle_provider(command_service: CommandService, args: str, user_id: str) -> CommandResult:
    return asyncio.run(command_service.switch_provider(args))


def handle_status(command_service: CommandService, args: str, user_id: str) -> CommandResult:
    status = asyncio.run(command_service.get_status(user_id))
    conv_display = status.conversation_id if status.conversation_id else "None (new session)"
    message = f"Status:\n  Provider: {status.provider}\n  Model:    {status.model}\n  Session:  {conv_display}"

    if status.has_partial_data:
        breakdown_note = " (partial)"
    elif status.has_estimates:
        breakdown_note = " (estimated)"
    else:
        breakdown_note = ""

    total_note = " (since last compaction)" if status.had_summarization else ""
    if status.has_estimates or status.has_partial_data:
        total_note += ", estimated" if status.had_summarization else " (estimated)"

    message += (
        f"\n  Tokens:   {status.input_tokens:,} in / {status.output_tokens:,} out{breakdown_note}"
        f" / {status.total_tokens:,} total{total_note}"
    )

    if status.last_input_tokens and status.context_window_size:
        pct = status.last_input_tokens / status.context_window_size * 100
        ctx_note = f" ({pct:.1f}%)"
        if pct >= 80:
            ctx_note += "  ⚠ approaching limit"
        message += f"\n  Context:  {status.last_input_tokens:,} / {status.context_window_size:,}{ctx_note}"

    if status.context_tokens:
        message += f"\n  History:  ~{status.context_tokens:,} ctx tokens"

    if status.estimated_cost_usd is not None:
        message += f"\n  Cost:     ~${status.estimated_cost_usd:.6f}"

    data = {
        "provider": status.provider,
        "model": status.model,
        "conversation_id": status.conversation_id,
        "total_tokens": status.total_tokens,
        "input_tokens": status.input_tokens,
        "output_tokens": status.output_tokens,
        "has_estimates": status.has_estimates,
        "has_partial_data": status.has_partial_data,
        "had_summarization": status.had_summarization,
        "estimated_cost_usd": status.estimated_cost_usd,
        "context_tokens": status.context_tokens,
        "last_input_tokens": status.last_input_tokens,
        "context_window_size": status.context_window_size,
    }
    return CommandResult(success=True, message=message, data=data)


def handle_help(command_service: CommandService, args: str, user_id: str) -> CommandResult:
    message = (
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
    return CommandResult(success=True, message=message)
