"""Provider-adaptive streaming response delivery for the bot."""

from __future__ import annotations

import asyncio
import contextlib
from dataclasses import dataclass, field
from typing import TYPE_CHECKING


if TYPE_CHECKING:
    from lib.services.ai_client.client import AIClient
    from lib.services.messaging_client.client import MessagingClient

    from .config import BotConfig


@dataclass
class DeliveryResult:
    response_text: str
    conversation_id: str | None = None
    usage: dict[str, int] | None = None
    message_ids: list[str] = field(default_factory=list)
    error: str | None = None


class StreamingResponseManager:
    def __init__(self, messaging_client: MessagingClient, config: BotConfig):
        self._messaging_client = messaging_client
        self._config = config

    async def deliver(
        self,
        provider: str,
        chat_id: str,
        ai_client: AIClient,
        prompt: str,
        conversation_id: str | None,
        provider_meta: dict,
    ) -> DeliveryResult:
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
                self._messaging_client.send_stream(
                    chat_id=chat_id,
                    text_stream=_pipe(),
                    provider=provider,
                    **provider_meta,
                )
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
            result = await self._messaging_client.send_message(
                chat_id=chat_id,
                text=text,
                provider=provider,
                **provider_meta,
            )
            return [result.message_id] if result.message_id else []

        try:
            async for chunk in ai_client.achat_stream(prompt=prompt, conversation_id=conversation_id):
                if isinstance(chunk, dict):
                    if "__conversation_id__" in chunk:
                        captured_conv_id = chunk["__conversation_id__"]
                    elif chunk.get("__done__"):
                        captured_conv_id = chunk.get("conversation_id", captured_conv_id)
                        captured_usage = chunk.get("usage")
                        captured_text = chunk.get("full_response", "")
                    elif chunk.get("__tool_call_start__"):
                        all_message_ids.extend(await _finish_segment())
                        tool_name = chunk.get("tool_name", "tool")
                        args = chunk.get("tool_args", {})
                        args_preview = ", ".join(f"{k}={repr(v)[:40]}" for k, v in args.items())
                        all_message_ids.extend(
                            await _send_notification(f"\U0001f527 Calling {tool_name}({args_preview})...")
                        )
                    elif chunk.get("__tool_call_end__"):
                        tool_name = chunk.get("tool_name", "tool")
                        result_preview = chunk.get("tool_result_preview", "")
                        if result_preview:
                            all_message_ids.extend(await _send_notification(f"\u2713 {tool_name} completed"))
                        else:
                            all_message_ids.extend(
                                await _send_notification(f"\u2713 {tool_name} completed (no output)")
                            )
                else:
                    if segment_queue is None:
                        await _start_segment()
                    await segment_queue.put(chunk)

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
