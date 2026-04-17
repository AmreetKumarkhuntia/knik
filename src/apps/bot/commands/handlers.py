"""Bot command handler implementations."""

from __future__ import annotations

from typing import TYPE_CHECKING

from lib.commands.models import CommandResult


if TYPE_CHECKING:
    from lib.commands.service import CommandService


async def handle_new(command_service: CommandService, args: str, user_id: str) -> CommandResult:
    result = await command_service.new_session(user_id)
    if result.success:
        welcome = (
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
        return CommandResult(success=True, message=welcome)
    return result


async def handle_resume(command_service: CommandService, args: str, user_id: str) -> CommandResult:
    if not args:
        sessions = await command_service.list_sessions(limit=5)
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

    return await command_service.resume_session(user_id, args)


async def handle_sessions(command_service: CommandService, args: str, user_id: str) -> CommandResult:
    page_size = 5

    page = 1
    if args.strip():
        try:
            page = max(1, int(args.strip()))
        except ValueError:
            return CommandResult(success=False, message="Usage: /sessions [page]\nExample: /sessions 2")

    offset = (page - 1) * page_size
    sessions = await command_service.list_sessions(limit=page_size, offset=offset)

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


async def handle_model(command_service: CommandService, args: str, user_id: str) -> CommandResult:
    return await command_service.switch_model(args)


async def handle_provider(command_service: CommandService, args: str, user_id: str) -> CommandResult:
    return await command_service.switch_provider(args)


async def handle_status(command_service: CommandService, args: str, user_id: str) -> CommandResult:
    status = await command_service.get_status(user_id)
    conv_display = status.conversation_id if status.conversation_id else "None (new session)"
    message = f"Status:\n  Provider: {status.provider}\n  Model: {status.model}\n  Session: {conv_display}"
    if status.total_tokens > 0:
        message += (
            f"\n  Tokens: {status.total_tokens:,} total ({status.input_tokens:,} in / {status.output_tokens:,} out)"
        )
    data = {
        "provider": status.provider,
        "model": status.model,
        "conversation_id": status.conversation_id,
        "total_tokens": status.total_tokens,
        "input_tokens": status.input_tokens,
        "output_tokens": status.output_tokens,
    }
    return CommandResult(success=True, message=message, data=data)


async def handle_revoke(command_service: CommandService, args: str, user_id: str) -> CommandResult:
    return CommandResult(
        success=True,
        message="All tool approvals revoked. Each tool will ask for permission again.",
        data={"revoke_consent": True},
    )


async def handle_help(command_service: CommandService, args: str, user_id: str) -> CommandResult:
    message = (
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
    return CommandResult(success=True, message=message)
