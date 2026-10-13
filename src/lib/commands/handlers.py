"""The commands every app shares, and the wording of their replies."""

from __future__ import annotations

from dataclasses import asdict
from typing import TYPE_CHECKING

from .models import CommandResult, SessionInfo, StatusInfo


if TYPE_CHECKING:
    from .registry import CommandHandler, CommandRegistry
    from .service import CommandService


SESSIONS_PAGE_SIZE = 5


async def handle_new(command_service: CommandService, args: str, user_id: str) -> CommandResult:
    return await command_service.new_session(user_id)


async def handle_resume(command_service: CommandService, args: str, user_id: str) -> CommandResult:
    if args:
        return await command_service.resume_session(user_id, args)

    sessions = await command_service.list_sessions(limit=5)
    if not sessions:
        return CommandResult(success=True, message="No previous conversations found.")
    lines = ["Recent conversations:", "", *_session_lines(sessions, first_index=1)]
    lines.append("Usage: /resume <id> or /resume #<number>")
    return CommandResult(success=True, message="\n".join(lines))


async def handle_sessions(command_service: CommandService, args: str, user_id: str) -> CommandResult:
    page = 1
    if args.strip():
        try:
            page = max(1, int(args.strip()))
        except ValueError:
            return CommandResult(success=False, message="Usage: /sessions [page]\nExample: /sessions 2")

    offset = (page - 1) * SESSIONS_PAGE_SIZE
    sessions = await command_service.list_sessions(limit=SESSIONS_PAGE_SIZE, offset=offset)

    if not sessions and page == 1:
        return CommandResult(success=True, message="No conversations found.")
    if not sessions:
        return CommandResult(success=True, message=f"No conversations on page {page}.")

    lines = [f"Conversations (page {page}):", "", *_session_lines(sessions, first_index=offset + 1)]
    lines.append("/resume #<number> or /resume <id> to continue")
    if len(sessions) == SESSIONS_PAGE_SIZE:
        lines.append(f"/sessions {page + 1} for next page")
    return CommandResult(success=True, message="\n".join(lines))


async def handle_model(command_service: CommandService, args: str, user_id: str) -> CommandResult:
    return await command_service.switch_model(user_id, args)


async def handle_provider(command_service: CommandService, args: str, user_id: str) -> CommandResult:
    return await command_service.switch_provider(user_id, args)


async def handle_status(command_service: CommandService, args: str, user_id: str) -> CommandResult:
    return format_status(await command_service.get_status(user_id))


def format_status(status: StatusInfo) -> CommandResult:
    conv_display = status.conversation_id if status.conversation_id else "None (new session)"
    message = f"Status:\n  Provider: {status.provider}\n  Model:    {status.model}\n  Session:  {conv_display}"

    if status.has_partial_data:
        breakdown_note = " (partial)"
    elif status.has_estimates:
        breakdown_note = " (estimated)"
    else:
        breakdown_note = ""

    # The total covers the whole conversation, compacted turns included.
    total_note = " (estimated)" if status.has_estimates or status.has_partial_data else ""

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

    data = asdict(status)
    del data["user_id"]
    return CommandResult(success=True, message=message, data=data)


def _session_lines(sessions: list[SessionInfo], first_index: int) -> list[str]:
    lines: list[str] = []
    for i, s in enumerate(sessions, first_index):
        title = s.title or "Untitled"
        updated = s.updated_at.strftime("%b %d %H:%M") if s.updated_at else "unknown"
        lines.append(f"  #{i} {title}")
        lines.append(f"     {updated} | {s.message_count} msgs")
        lines.append(f"     {s.conversation_id}")
        lines.append("")
    return lines


# In the order the apps list them; /help is not shared because each app words it for its own commands.
SHARED_COMMANDS: tuple[tuple[str, str, CommandHandler], ...] = (
    ("new", "Start a fresh conversation", handle_new),
    ("resume", "Resume a previous conversation", handle_resume),
    ("sessions", "List recent conversations", handle_sessions),
    ("model", "Show or switch AI model", handle_model),
    ("provider", "Show or switch AI provider", handle_provider),
    ("status", "Show current configuration", handle_status),
)


def register_shared_commands(registry: CommandRegistry) -> None:
    """An app that words a shared command differently registers its own handler under the same name afterwards."""
    for name, description, handler in SHARED_COMMANDS:
        registry.register(name, description, handler)
