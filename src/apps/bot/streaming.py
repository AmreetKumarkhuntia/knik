"""Provider-adaptive streaming response delivery for the bot."""

from __future__ import annotations

import asyncio
import contextlib
import logging
import re
from dataclasses import dataclass, field
from enum import Enum
from typing import TYPE_CHECKING


if TYPE_CHECKING:
    from lib.services.ai_client.client import AIClient
    from lib.services.messaging_client.client import MessagingClient

    from .config import BotConfig

logger = logging.getLogger(__name__)

DEFAULT_EDIT_DEBOUNCE_INTERVAL: float = 0.5
DEFAULT_PLACEHOLDER_TEXT: str = "..."
DEFAULT_MAX_MESSAGE_LENGTH: int = 4096
SENTENCE_BOUNDARY_PATTERN = re.compile(r"[.!?。\uff01\uff1f\n]")
MIN_CHUNK_SIZE_FOR_EDIT: int = 10


@dataclass
class DeliveryResult:
    """Result of a response delivery operation."""

    response_text: str
    conversation_id: str | None = None
    usage: dict[str, int] | None = None
    message_ids: list[str] = field(default_factory=list)
    was_streaming: bool = False
    edit_count: int = 0
    error: str | None = None


@dataclass
class StreamingState:
    """Mutable state during a single streaming delivery."""

    accumulated_text: str = ""
    last_edit_text: str = ""
    last_edit_time: float = 0.0
    message_ids: list[str] = field(default_factory=list)
    edit_count: int = 0
    stream_complete: bool = False
    error: str | None = None


class DeliveryMode(Enum):
    """Response delivery mode."""

    STREAMING = "streaming"
    COMPLETE = "complete"


class StreamingResponseManager:
    """Handles provider-adaptive response delivery.

    Routing logic:
    - If provider supports message editing -> streaming with edits
    - Otherwise -> wait for complete response, send as single message

    Features:
    - Debounced editing to avoid rate limits
    - Automatic chunking for messages exceeding length limits
    - Graceful error handling and recovery
    """

    def __init__(
        self,
        messaging_client: MessagingClient,
        config: BotConfig,
        edit_debounce_interval: float = DEFAULT_EDIT_DEBOUNCE_INTERVAL,
        placeholder_text: str = DEFAULT_PLACEHOLDER_TEXT,
        max_message_length: int = DEFAULT_MAX_MESSAGE_LENGTH,
    ):
        self._messaging_client = messaging_client
        self._config = config
        self._edit_debounce_interval = edit_debounce_interval
        self._placeholder_text = placeholder_text
        self._max_message_length = max_message_length

    @property
    def edit_debounce_interval(self) -> float:
        return self._edit_debounce_interval

    @edit_debounce_interval.setter
    def edit_debounce_interval(self, value: float) -> None:
        self._edit_debounce_interval = max(0.1, value)

    async def deliver(
        self,
        provider: str,
        chat_id: str,
        ai_client: AIClient,
        prompt: str,
        conversation_id: str | None,
        provider_meta: dict,
    ) -> DeliveryResult:
        """Main entry point. Routes based on provider capability."""
        try:
            supports_edit = self._messaging_client.supports_message_edit(provider)

            if supports_edit:
                logger.debug("Using streaming delivery", extra={"provider": provider, "chat_id": chat_id})
                return await self._send_and_edit(
                    provider=provider,
                    chat_id=chat_id,
                    ai_client=ai_client,
                    prompt=prompt,
                    conversation_id=conversation_id,
                    provider_meta=provider_meta,
                )

            logger.debug("Using complete delivery", extra={"provider": provider, "chat_id": chat_id})
            return await self._send_complete(
                provider=provider,
                chat_id=chat_id,
                ai_client=ai_client,
                prompt=prompt,
                conversation_id=conversation_id,
                provider_meta=provider_meta,
            )
        except Exception as e:
            logger.exception("Delivery failed")
            return DeliveryResult(response_text="", conversation_id=conversation_id, error=str(e))

    async def _send_and_edit(
        self,
        provider: str,
        chat_id: str,
        ai_client: AIClient,
        prompt: str,
        conversation_id: str | None,
        provider_meta: dict,
    ) -> DeliveryResult:
        """Streaming delivery with debounced editing."""
        state = StreamingState()
        state.last_edit_time = asyncio.get_event_loop().time()
        usage: dict[str, int] | None = None

        message_id = await self._send_placeholder(provider, chat_id, provider_meta)
        if not message_id:
            return DeliveryResult(
                response_text="", conversation_id=conversation_id, error="Failed to send placeholder message"
            )
        state.message_ids.append(message_id)

        try:
            async for chunk in ai_client.achat_stream(
                prompt=prompt,
                conversation_id=conversation_id,
            ):
                if isinstance(chunk, dict):
                    if "__conversation_id__" in chunk:
                        conversation_id = chunk["__conversation_id__"]
                    elif chunk.get("__done__"):
                        conversation_id = chunk.get("conversation_id", conversation_id)
                        usage = chunk.get("usage")
                    continue

                state.accumulated_text += chunk

                if self._should_edit_now(state):
                    await self._update_messages(provider, chat_id, state, provider_meta)

            await self._update_messages(provider, chat_id, state, provider_meta, force=True)
            state.stream_complete = True

            return DeliveryResult(
                response_text=state.accumulated_text,
                conversation_id=conversation_id,
                usage=usage,
                message_ids=state.message_ids,
                was_streaming=True,
                edit_count=state.edit_count,
            )
        except Exception as e:
            await self._handle_stream_error(provider, chat_id, state, e, provider_meta)
            return DeliveryResult(
                response_text=state.accumulated_text,
                conversation_id=conversation_id,
                usage=usage,
                message_ids=state.message_ids,
                error=str(e),
            )

    async def _send_complete(
        self,
        provider: str,
        chat_id: str,
        ai_client: AIClient,
        prompt: str,
        conversation_id: str | None,
        provider_meta: dict,
    ) -> DeliveryResult:
        """Non-streaming delivery."""
        try:
            response_text, conversation_id, usage = await ai_client.achat(
                prompt=prompt,
                conversation_id=conversation_id,
            )

            if not response_text:
                response_text = "I apologize, but I couldn't generate a response."

            chunks = self._chunk_text(response_text)
            message_ids: list[str] = []

            for chunk in chunks:
                result = await self._messaging_client.send_message(
                    provider=provider,
                    chat_id=chat_id,
                    text=chunk,
                    **provider_meta,
                )
                if result.message_id:
                    message_ids.append(result.message_id)

            return DeliveryResult(
                response_text=response_text,
                conversation_id=conversation_id,
                usage=usage,
                message_ids=message_ids,
                was_streaming=False,
            )
        except Exception as e:
            logger.exception("Complete delivery failed")
            with contextlib.suppress(Exception):
                await self._messaging_client.send_message(
                    provider=provider,
                    chat_id=chat_id,
                    text="\u274c An error occurred while generating the response.",
                    **provider_meta,
                )

            return DeliveryResult(response_text="", conversation_id=conversation_id, error=str(e))

    def _detect_sentence_boundary(self, text: str) -> bool:
        """Check if text ends with a sentence boundary character."""
        if not text:
            return False
        return bool(SENTENCE_BOUNDARY_PATTERN.match(text[-1]))

    def _should_edit_now(self, state: StreamingState, force: bool = False) -> bool:
        """Determine if a debounced edit should be triggered."""
        if force:
            return state.accumulated_text != state.last_edit_text

        current_time = asyncio.get_event_loop().time()
        time_since_last_edit = current_time - state.last_edit_time

        new_text = state.accumulated_text[len(state.last_edit_text) :]

        if len(new_text) < MIN_CHUNK_SIZE_FOR_EDIT:
            return False

        if self._detect_sentence_boundary(new_text):
            return True

        return time_since_last_edit >= self._edit_debounce_interval

    def _chunk_text(self, text: str) -> list[str]:
        """Split text into chunks respecting message length limits."""
        if len(text) <= self._max_message_length:
            return [text]

        chunks: list[str] = []
        remaining = text

        while remaining:
            if len(remaining) <= self._max_message_length:
                chunks.append(remaining)
                break

            split_point = self._find_split_point(remaining, self._max_message_length)
            chunks.append(remaining[:split_point].rstrip())
            remaining = remaining[split_point:].lstrip()

        return chunks

    def _find_split_point(self, text: str, max_length: int) -> int:
        """Find optimal split point in text."""
        search_start = max(0, max_length - 500)
        newline_pos = text.rfind("\n", search_start, max_length)

        if newline_pos > search_start:
            return newline_pos + 1

        space_start = max(0, max_length - 200)
        space_pos = text.rfind(" ", space_start, max_length)

        if space_pos > space_start:
            return space_pos + 1

        return max_length

    async def _send_placeholder(self, provider: str, chat_id: str, provider_meta: dict) -> str | None:
        """Send initial placeholder message, return message_id or None."""
        try:
            result = await self._messaging_client.send_message(
                provider=provider,
                chat_id=chat_id,
                text=self._placeholder_text,
                **provider_meta,
            )
            return result.message_id
        except Exception as e:
            logger.error(
                "Failed to send placeholder message",
                extra={"provider": provider, "chat_id": chat_id, "error": str(e)},
            )
            return None

    async def _edit_message_safe(
        self, provider: str, chat_id: str, message_id: str, text: str, provider_meta: dict
    ) -> bool:
        """Edit message with error handling, return success status."""
        try:
            result = await self._messaging_client.edit_message(
                provider=provider,
                chat_id=chat_id,
                message_id=message_id,
                text=text,
                **provider_meta,
            )
            return result.success
        except Exception as e:
            logger.warning(
                "Failed to edit message",
                extra={"provider": provider, "chat_id": chat_id, "message_id": message_id, "error": str(e)},
            )
            return False

    async def _send_overflow_chunk(self, provider: str, chat_id: str, text: str, provider_meta: dict) -> str | None:
        """Send overflow text as new message, return message_id."""
        try:
            result = await self._messaging_client.send_message(
                provider=provider,
                chat_id=chat_id,
                text=text,
                **provider_meta,
            )
            return result.message_id
        except Exception as e:
            logger.error(
                "Failed to send overflow chunk",
                extra={"provider": provider, "chat_id": chat_id, "error": str(e)},
            )
            return None

    async def _handle_stream_error(
        self,
        provider: str,
        chat_id: str,
        state: StreamingState,
        error: Exception,
        provider_meta: dict,
    ) -> None:
        """Handle errors during streaming, notify user."""
        error_message = "\u274c An error occurred while generating the response."

        if state.message_ids:
            message_id = state.message_ids[0]
            await self._edit_message_safe(
                provider=provider,
                chat_id=chat_id,
                message_id=message_id,
                text=error_message,
                provider_meta=provider_meta,
            )
        else:
            await self._send_overflow_chunk(
                provider=provider,
                chat_id=chat_id,
                text=error_message,
                provider_meta=provider_meta,
            )

        state.error = str(error)

    async def _update_messages(
        self,
        provider: str,
        chat_id: str,
        state: StreamingState,
        provider_meta: dict,
        force: bool = False,
    ) -> None:
        """Update messages with current accumulated text. Handles chunking if text exceeds limits."""
        if not self._should_edit_now(state, force=force):
            return

        chunks = self._chunk_text(state.accumulated_text)

        for i, chunk in enumerate(chunks):
            if i < len(state.message_ids):
                success = await self._edit_message_safe(
                    provider=provider,
                    chat_id=chat_id,
                    message_id=state.message_ids[i],
                    text=chunk,
                    provider_meta=provider_meta,
                )
                if not success and i == 0:
                    new_id = await self._send_overflow_chunk(
                        provider=provider,
                        chat_id=chat_id,
                        text=chunk,
                        provider_meta=provider_meta,
                    )
                    if new_id:
                        state.message_ids[i] = new_id
            else:
                new_id = await self._send_overflow_chunk(
                    provider=provider,
                    chat_id=chat_id,
                    text=chunk,
                    provider_meta=provider_meta,
                )
                if new_id:
                    state.message_ids.append(new_id)

        state.last_edit_text = state.accumulated_text
        state.last_edit_time = asyncio.get_event_loop().time()
        state.edit_count += 1
