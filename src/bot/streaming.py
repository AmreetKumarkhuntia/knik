"""Streams an AI reply to a chat, one live message per text segment between tool calls."""

from __future__ import annotations

import asyncio
import contextlib
from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Any

from imports import ConversationReady, StreamDone, StreamError, TextDelta, ToolCallFinished, ToolCallStarted


if TYPE_CHECKING:
    from imports import AIClient

    from .config import BotConfig
    from .transport import MessagingTransport


@dataclass
class DeliveryResult:
    response_text: str
    conversation_id: str | None = None
    usage: dict[str, int] | None = None
    message_ids: list[str] = field(default_factory=list)
    error: str | None = None


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
    ) -> DeliveryResult:
        send_options = send_options or {}
        captured_conv_id: str | None = conversation_id
        captured_usage: dict[str, int] | None = None
        captured_text = ""
        all_message_ids: list[str] = []

        segment_queue: asyncio.Queue[str | None] | None = None
        segment_task: asyncio.Task | None = None

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
            msg_ids = [result.message_id] if result.message_id else []
            segment_queue = None
            segment_task = None
            return msg_ids

        async def _send_notification(text: str) -> list[str]:
            result = await self._transport.send_message(chat_id=chat_id, text=text, **send_options)
            return [result.message_id] if result.message_id else []

        try:
            async for event in ai_client.achat_stream(prompt=prompt, conversation_id=conversation_id):
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
                            await _start_segment()
                        await segment_queue.put(text)

            all_message_ids.extend(await _finish_segment())

            return DeliveryResult(
                response_text=captured_text,
                conversation_id=captured_conv_id,
                usage=captured_usage,
                message_ids=all_message_ids,
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
            )
