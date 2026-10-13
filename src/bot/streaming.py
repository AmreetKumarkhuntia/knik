"""Streams an AI reply to a chat, one live message per text segment between tool calls."""

from __future__ import annotations

import asyncio
import contextlib
from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Any

from imports import ConversationReady, StreamDone, StreamError, TextDelta, ToolCallFinished, ToolCallStarted, printer

from .user_identity import SOURCE


if TYPE_CHECKING:
    from imports import AIClient, MessageResult

    from .config import BotConfig
    from .transport import MessagingTransport


@dataclass
class DeliveryResult:
    response_text: str
    conversation_id: str | None = None
    usage: dict[str, int] | None = None
    message_ids: list[str] = field(default_factory=list)
    # The AI reply could not be produced; nothing after the failure was sent.
    error: str | None = None
    # Reply segments the transport reported as failed. The reply itself was produced (and saved), but the user did
    # not see all of its text. A tool notice that fails to send is only logged.
    send_errors: list[str] = field(default_factory=list)

    @property
    def delivered(self) -> bool:
        return self.error is None and not self.send_errors


class StreamingResponseManager:
    def __init__(self, transport: MessagingTransport, config: BotConfig):
        self._transport = transport
        self._config = config

    async def deliver(
        self,
        chat_id: str,
        ai_client: AIClient,
        prompt: str,
        conversation_id: str | None,
        send_options: dict[str, Any] | None = None,
        user_id: str | None = None,
    ) -> DeliveryResult:
        """Stream the reply into the chat. A conversation the reply starts is recorded as `user_id`'s."""
        send_options = send_options or {}
        captured_conv_id: str | None = conversation_id
        captured_usage: dict[str, int] | None = None
        captured_text = ""
        all_message_ids: list[str] = []
        send_errors: list[str] = []

        segment_queue: asyncio.Queue[str | None] | None = None
        segment_task: asyncio.Task | None = None

        def _sent(result: MessageResult, what: str) -> list[str]:
            if not result.success:
                printer.warning(f"Failed to send {what} to chat {chat_id}: {result.error or 'unknown error'}")
                return []
            return [result.message_id] if result.message_id else []

        async def _start_segment() -> None:
            nonlocal segment_queue, segment_task
            segment_queue = asyncio.Queue()
            q = segment_queue

            async def _pipe():
                while True:
                    chunk = await q.get()
                    if chunk is None:
                        return
                    yield chunk

            segment_task = asyncio.create_task(
                self._transport.send_stream(chat_id=chat_id, text_stream=_pipe(), **send_options)
            )

        async def _finish_segment() -> list[str]:
            nonlocal segment_queue, segment_task
            if segment_queue is None:
                return []
            await segment_queue.put(None)
            result = await segment_task
            segment_queue = None
            segment_task = None
            if not result.success:
                send_errors.append(result.error or "unknown error")
            return _sent(result, "a reply segment")

        async def _send_notification(text: str) -> list[str]:
            # Not a send error: the tools have run by now, and the error reply would have the user run them again.
            result = await self._transport.send_message(chat_id=chat_id, text=text, **send_options)
            return _sent(result, "a tool notice")

        try:
            async for event in ai_client.achat_stream(
                prompt=prompt, conversation_id=conversation_id, user_id=user_id, source=SOURCE
            ):
                match event:
                    case ConversationReady(conversation_id=conv_id):
                        captured_conv_id = conv_id
                    case StreamDone():
                        captured_conv_id = event.conversation_id
                        captured_usage = event.usage
                        captured_text = event.full_response
                    case ToolCallStarted(tool_name=tool_name, tool_args=args):
                        all_message_ids.extend(await _finish_segment())
                        args_preview = ", ".join(f"{k}={repr(v)[:40]}" for k, v in args.items())
                        all_message_ids.extend(
                            await _send_notification(f"\U0001f527 Calling {tool_name}({args_preview})...")
                        )
                    case ToolCallFinished(tool_name=tool_name, result_preview=result_preview):
                        if result_preview:
                            all_message_ids.extend(await _send_notification(f"\u2713 {tool_name} completed"))
                        else:
                            all_message_ids.extend(
                                await _send_notification(f"\u2713 {tool_name} completed (no output)")
                            )
                    # A provider failure reads as reply text ("Chat streaming error: ..."), as it always has.
                    case TextDelta(text=text) | StreamError(message=text):
                        if segment_queue is None:
                            # A segment starts at its first visible text: whitespace alone, which models often send
                            # before a tool call, is a message Telegram refuses.
                            if not text.strip():
                                continue
                            await _start_segment()
                        await segment_queue.put(text)

            all_message_ids.extend(await _finish_segment())

            return DeliveryResult(
                response_text=captured_text,
                conversation_id=captured_conv_id,
                usage=captured_usage,
                message_ids=all_message_ids,
                send_errors=send_errors,
            )
        except Exception as e:
            if segment_queue is not None:
                await segment_queue.put(None)
                with contextlib.suppress(Exception):
                    await segment_task
            return DeliveryResult(
                response_text=captured_text,
                conversation_id=captured_conv_id,
                error=str(e),
                send_errors=send_errors,
            )
