"""Provider-adaptive streaming response delivery for the bot."""

from __future__ import annotations

from collections.abc import AsyncIterator
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

        async def _text_only() -> AsyncIterator[str]:
            nonlocal captured_conv_id, captured_usage, captured_text

            async for chunk in ai_client.achat_stream(prompt=prompt, conversation_id=conversation_id):
                if isinstance(chunk, dict):
                    if "__conversation_id__" in chunk:
                        captured_conv_id = chunk["__conversation_id__"]
                    elif chunk.get("__done__"):
                        captured_conv_id = chunk.get("conversation_id", captured_conv_id)
                        captured_usage = chunk.get("usage")
                        captured_text = chunk.get("full_response", "")
                    continue

                captured_text += chunk
                yield chunk

        try:
            result = await self._messaging_client.send_stream(
                chat_id=chat_id,
                text_stream=_text_only(),
                provider=provider,
                **provider_meta,
            )

            return DeliveryResult(
                response_text=captured_text,
                conversation_id=captured_conv_id,
                usage=captured_usage,
                message_ids=[result.message_id] if result.message_id else [],
                error=result.error,
            )
        except Exception as e:
            return DeliveryResult(
                response_text=captured_text,
                conversation_id=captured_conv_id,
                error=str(e),
            )
