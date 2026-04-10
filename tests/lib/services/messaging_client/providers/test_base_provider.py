"""Tests for base messaging provider."""

import pytest

from src.lib.services.messaging_client.models import MessageResult
from src.lib.services.messaging_client.providers.base_provider import BaseMessagingProvider


class MockProvider(BaseMessagingProvider):
    """Minimal implementation for testing."""

    @classmethod
    def get_provider_name(cls) -> str:
        return "mock"

    async def send_message(self, chat_id: str, text: str, **kwargs) -> MessageResult:
        return MessageResult(success=True, message_id="1")

    async def start(self, on_message) -> None:
        pass

    async def stop(self) -> None:
        pass

    def is_configured(self) -> bool:
        return True

    def get_info(self) -> dict:
        return {}

    async def register_bot_commands(self, commands) -> None:
        pass


def test_default_supports_message_edit():
    provider = MockProvider()
    assert provider.supports_message_edit() is False


@pytest.mark.asyncio
async def test_default_edit_message_returns_error():
    provider = MockProvider()
    result = await provider.edit_message("123", "1", "text")
    assert result.success is False
    assert "not supported" in result.error.lower()


@pytest.mark.asyncio
async def test_default_send_stream_consumes_and_sends():
    provider = MockProvider()

    async def chunks():
        yield "Hello"
        yield " world"
        yield "!"

    result = await provider.send_stream("chat_123", chunks())
    assert result.success is True
    assert result.message_id == "1"


@pytest.mark.asyncio
async def test_default_send_stream_empty_iterator():
    provider = MockProvider()

    async def empty():
        return
        yield

    result = await provider.send_stream("chat_123", empty())
    assert result.success is True
