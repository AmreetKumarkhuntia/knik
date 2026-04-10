"""Tests for StreamingResponseManager."""

from unittest.mock import AsyncMock, MagicMock

import pytest

from src.apps.bot.streaming import StreamingResponseManager


async def _consume_stream(chat_id, text_stream, **kwargs):
    async for _ in text_stream:
        pass
    return MagicMock(success=True, message_id="msg_123", error=None, raw={})


@pytest.fixture
def mock_messaging_client():
    client = MagicMock()
    client.send_stream = AsyncMock(side_effect=_consume_stream)
    return client


@pytest.fixture
def mock_config():
    return MagicMock()


@pytest.fixture
def mock_ai_client():
    client = MagicMock()

    async def mock_stream(*args, **kwargs):
        yield {"__conversation_id__": "conv_123"}
        yield "Hello"
        yield " world"
        yield "!"
        yield {
            "__done__": True,
            "conversation_id": "conv_123",
            "usage": {"total_tokens": 15},
            "full_response": "Hello world!",
        }

    client.achat_stream = mock_stream
    return client


@pytest.fixture
def manager(mock_messaging_client, mock_config):
    return StreamingResponseManager(
        messaging_client=mock_messaging_client,
        config=mock_config,
    )


class TestStreamingResponseManager:
    @pytest.mark.asyncio
    async def test_deliver_streams_text_and_returns_result(self, manager, mock_messaging_client, mock_ai_client):
        result = await manager.deliver(
            provider="telegram",
            chat_id="chat_123",
            ai_client=mock_ai_client,
            prompt="Hello",
            conversation_id=None,
            provider_meta={},
        )

        assert result.response_text == "Hello world!"
        assert result.conversation_id == "conv_123"
        assert result.usage == {"total_tokens": 15}
        assert result.error is None
        assert "msg_123" in result.message_ids
        mock_messaging_client.send_stream.assert_called_once()

    @pytest.mark.asyncio
    async def test_deliver_passes_provider_meta(self, manager, mock_messaging_client, mock_ai_client):
        await manager.deliver(
            provider="telegram",
            chat_id="chat_123",
            ai_client=mock_ai_client,
            prompt="Hello",
            conversation_id=None,
            provider_meta={"parse_mode": "Markdown"},
        )

        call_kwargs = mock_messaging_client.send_stream.call_args
        assert call_kwargs.kwargs["provider"] == "telegram"
        assert call_kwargs.kwargs["parse_mode"] == "Markdown"

    @pytest.mark.asyncio
    async def test_deliver_captures_conversation_id_from_early_sentinel(self, manager, mock_messaging_client):
        async def stream(*a, **kw):
            yield {"__conversation_id__": "conv_early"}
            yield "text"
            yield {"__done__": True, "conversation_id": "conv_final", "usage": {}, "full_response": "text"}

        mock_ai = MagicMock()
        mock_ai.achat_stream = stream

        result = await manager.deliver(
            provider="telegram",
            chat_id="chat_123",
            ai_client=mock_ai,
            prompt="Hi",
            conversation_id=None,
            provider_meta={},
        )

        assert result.conversation_id == "conv_final"

    @pytest.mark.asyncio
    async def test_deliver_returns_error_on_exception(self, manager, mock_messaging_client):
        mock_messaging_client.send_stream.side_effect = RuntimeError("broken")

        async def stream(*a, **kw):
            yield "hello"
            yield {"__done__": True, "conversation_id": "c1", "usage": {}, "full_response": "hello"}

        mock_ai = MagicMock()
        mock_ai.achat_stream = stream

        result = await manager.deliver(
            provider="telegram",
            chat_id="chat_123",
            ai_client=mock_ai,
            prompt="Hi",
            conversation_id=None,
            provider_meta={},
        )

        assert result.error is not None
        assert "broken" in result.error

    @pytest.mark.asyncio
    async def test_deliver_handles_empty_response(self, manager, mock_messaging_client):
        async def stream(*a, **kw):
            yield {"__conversation_id__": "conv_empty"}
            yield {"__done__": True, "conversation_id": "conv_empty", "usage": None, "full_response": ""}

        mock_ai = MagicMock()
        mock_ai.achat_stream = stream

        result = await manager.deliver(
            provider="telegram",
            chat_id="chat_123",
            ai_client=mock_ai,
            prompt="Hi",
            conversation_id=None,
            provider_meta={},
        )

        assert result.response_text == ""

    @pytest.mark.asyncio
    async def test_deliver_returns_message_ids_from_send_stream(self, manager, mock_messaging_client):
        async def consume_and_return_id(chat_id, text_stream, **kwargs):
            async for _ in text_stream:
                pass
            return MagicMock(success=True, message_id="final_msg_999", error=None)

        mock_messaging_client.send_stream.side_effect = consume_and_return_id

        async def stream(*a, **kw):
            yield "hi"
            yield {"__done__": True, "conversation_id": "c1", "usage": {}, "full_response": "hi"}

        mock_ai = MagicMock()
        mock_ai.achat_stream = stream

        result = await manager.deliver(
            provider="telegram",
            chat_id="chat_123",
            ai_client=mock_ai,
            prompt="Hi",
            conversation_id=None,
            provider_meta={},
        )

        assert result.message_ids == ["final_msg_999"]

    @pytest.mark.asyncio
    async def test_deliver_handles_no_message_id(self, manager, mock_messaging_client):
        async def consume_and_return_none(chat_id, text_stream, **kwargs):
            async for _ in text_stream:
                pass
            return MagicMock(success=True, message_id=None, error=None)

        mock_messaging_client.send_stream.side_effect = consume_and_return_none

        async def stream(*a, **kw):
            yield "hi"
            yield {"__done__": True, "conversation_id": "c1", "usage": {}, "full_response": "hi"}

        mock_ai = MagicMock()
        mock_ai.achat_stream = stream

        result = await manager.deliver(
            provider="telegram",
            chat_id="chat_123",
            ai_client=mock_ai,
            prompt="Hi",
            conversation_id=None,
            provider_meta={},
        )

        assert result.message_ids == []
