"""Mock messaging provider for testing."""

import asyncio
from typing import Any

from ....utils import printer
from ..models import MessageResult
from ..registry import MessagingProviderRegistry
from .base_provider import BaseMessagingProvider, MessageCallback


class MockMessagingProvider(BaseMessagingProvider):
    """In-memory mock provider that logs messages via printer."""

    @classmethod
    def get_provider_name(cls) -> str:
        return "mock"

    def __init__(self, **kwargs):
        self._sent: list[dict[str, Any]] = []
        self._running = False
        printer.info("MockMessagingProvider initialized")

    async def send_message(self, chat_id: str, text: str, **kwargs) -> MessageResult:
        self._sent.append({"chat_id": chat_id, "text": text, **kwargs})
        printer.debug(f"[MOCK MSG] -> {chat_id}: {text[:80]}")
        return MessageResult(success=True, message_id=str(len(self._sent)))

    async def start(self, on_message: MessageCallback) -> None:
        self._running = True
        printer.info("[MOCK MSG] Provider started (no-op, awaiting stop)")
        # Blocks until stop() flips _running so callers can await start() as a long-running task
        while self._running:
            await asyncio.sleep(1)

    async def stop(self) -> None:
        self._running = False
        printer.info("[MOCK MSG] Provider stopped")

    def is_configured(self) -> bool:
        return True

    def get_info(self) -> dict[str, Any]:
        return {
            "provider": "mock",
            "configured": True,
            "messages_sent": len(self._sent),
        }

    @property
    def sent_messages(self) -> list[dict[str, Any]]:
        return list(self._sent)


MessagingProviderRegistry.register(MockMessagingProvider.get_provider_name(), MockMessagingProvider)
