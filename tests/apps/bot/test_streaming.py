"""Tests for StreamingResponseManager."""

import asyncio
from unittest.mock import AsyncMock, MagicMock

import pytest

from src.apps.bot.streaming import (
    StreamingResponseManager,
    StreamingState,
)


@pytest.fixture
def mock_messaging_client():
    client = MagicMock()
    client.supports_message_edit = MagicMock(return_value=True)
    client.send_message = AsyncMock()
    client.send_message.return_value = MagicMock(success=True, message_id="msg_123", error=None, raw={})
    client.edit_message = AsyncMock()
    client.edit_message.return_value = MagicMock(success=True, message_id="msg_123", error=None, raw={})
    client.chunk_text = MagicMock(side_effect=lambda text, provider=None: [text])
    return client


@pytest.fixture
def mock_config():
    config = MagicMock()
    config.ai_provider = "openai"
    config.ai_model = "gpt-4"
    return config


@pytest.fixture
def mock_ai_client_streaming():
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
def mock_ai_client_complete():
    client = MagicMock()
    client.achat = AsyncMock(return_value=("Hello world!", "conv_123", {"total_tokens": 15}))
    return client


@pytest.fixture
def manager(mock_messaging_client, mock_config):
    return StreamingResponseManager(
        messaging_client=mock_messaging_client,
        config=mock_config,
        edit_debounce_interval=0.1,
    )


class TestStreamingResponseManager:
    @pytest.mark.asyncio
    async def test_deliver_routes_to_streaming_when_supported(
        self, manager, mock_messaging_client, mock_ai_client_streaming
    ):
        mock_messaging_client.supports_message_edit.return_value = True

        result = await manager.deliver(
            provider="telegram",
            chat_id="chat_123",
            ai_client=mock_ai_client_streaming,
            prompt="Hello",
            conversation_id=None,
            provider_meta={},
        )

        assert result.was_streaming is True
        assert result.response_text == "Hello world!"
        assert result.conversation_id == "conv_123"
        assert len(result.message_ids) >= 1

    @pytest.mark.asyncio
    async def test_deliver_routes_to_complete_when_not_supported(
        self, manager, mock_messaging_client, mock_ai_client_complete
    ):
        mock_messaging_client.supports_message_edit.return_value = False

        result = await manager.deliver(
            provider="discord",
            chat_id="chat_123",
            ai_client=mock_ai_client_complete,
            prompt="Hello",
            conversation_id=None,
            provider_meta={},
        )

        assert result.was_streaming is False
        assert result.response_text == "Hello world!"
        mock_ai_client_complete.achat.assert_called_once()

    @pytest.mark.asyncio
    async def test_send_and_edit_sends_placeholder(self, manager, mock_messaging_client, mock_ai_client_streaming):
        await manager._send_and_edit(
            provider="telegram",
            chat_id="chat_123",
            ai_client=mock_ai_client_streaming,
            prompt="Hello",
            conversation_id=None,
            provider_meta={},
        )

        mock_messaging_client.send_message.assert_called()
        first_call_text = mock_messaging_client.send_message.call_args_list[0][1]["text"]
        assert first_call_text == "..."

    @pytest.mark.asyncio
    async def test_send_and_edit_handles_edit_failure(self, manager, mock_messaging_client, mock_ai_client_streaming):
        mock_messaging_client.edit_message.side_effect = Exception("Message deleted")

        result = await manager._send_and_edit(
            provider="telegram",
            chat_id="chat_123",
            ai_client=mock_ai_client_streaming,
            prompt="Hello",
            conversation_id=None,
            provider_meta={},
        )

        assert result.response_text == "Hello world!"

    @pytest.mark.asyncio
    async def test_placeholder_failure_returns_error(self, manager, mock_messaging_client, mock_ai_client_streaming):
        mock_messaging_client.send_message.side_effect = Exception("Network error")

        result = await manager._send_and_edit(
            provider="telegram",
            chat_id="chat_123",
            ai_client=mock_ai_client_streaming,
            prompt="Hello",
            conversation_id=None,
            provider_meta={},
        )

        assert result.error is not None
        assert "Failed to send placeholder" in result.error

    @pytest.mark.asyncio
    async def test_deliver_returns_error_on_exception(self, manager, mock_messaging_client, mock_ai_client_streaming):
        mock_messaging_client.supports_message_edit.side_effect = RuntimeError("broken")

        result = await manager.deliver(
            provider="telegram",
            chat_id="chat_123",
            ai_client=mock_ai_client_streaming,
            prompt="Hello",
            conversation_id=None,
            provider_meta={},
        )

        assert result.error is not None

    @pytest.mark.asyncio
    async def test_send_complete_handles_empty_response(self, manager, mock_messaging_client):
        mock_ai = MagicMock()
        mock_ai.achat = AsyncMock(return_=("", None, None))
        mock_ai.achat = AsyncMock(return_value=("", None, None))

        result = await manager._send_complete(
            provider="discord",
            chat_id="chat_123",
            ai_client=mock_ai,
            prompt="Hello",
            conversation_id=None,
            provider_meta={},
        )

        assert "apologize" in result.response_text

    @pytest.mark.asyncio
    async def test_send_complete_sends_error_message_on_failure(self, manager, mock_messaging_client):
        mock_ai = MagicMock()
        mock_ai.achat = AsyncMock(side_effect=RuntimeError("AI down"))

        result = await manager._send_complete(
            provider="discord",
            chat_id="chat_123",
            ai_client=mock_ai,
            prompt="Hello",
            conversation_id=None,
            provider_meta={},
        )

        assert result.error is not None
        last_send_call = mock_messaging_client.send_message.call_args_list[-1]
        assert "\u274c" in last_send_call[1]["text"]


class TestDebounceLogic:
    def test_should_edit_now_returns_false_for_small_text(self, manager):
        state = StreamingState(accumulated_text="Hello", last_edit_text="", last_edit_time=0)
        assert manager._should_edit_now(state) is False

    def test_should_edit_now_returns_true_for_sentence_boundary(self, manager):
        state = StreamingState(
            accumulated_text="Hello world. How are you?", last_edit_text="Hello world", last_edit_time=0
        )
        assert manager._should_edit_now(state) is True

    def test_should_edit_now_returns_true_for_force(self, manager):
        state = StreamingState(accumulated_text="Hello", last_edit_text="", last_edit_time=0)
        assert manager._should_edit_now(state, force=True) is True

    def test_should_edit_now_returns_false_for_force_when_no_new_text(self, manager):
        state = StreamingState(accumulated_text="Hello", last_edit_text="Hello", last_edit_time=0)
        assert manager._should_edit_now(state, force=True) is False

    def test_should_edit_now_returns_true_after_debounce_interval(self, manager):
        state = StreamingState(
            accumulated_text="Hello world this is a longer text",
            last_edit_text="",
            last_edit_time=asyncio.get_event_loop().time() - 1.0,
        )
        assert manager._should_edit_now(state) is True


class TestStreamingIntegration:
    @pytest.mark.asyncio
    async def test_full_streaming_flow(self, manager, mock_messaging_client):
        async def mock_stream(*args, **kwargs):
            yield {"__conversation_id__": "conv_456"}
            yield "First sentence. "
            yield "Second sentence! "
            yield "Third sentence?\n"
            yield "Final text."
            yield {
                "__done__": True,
                "conversation_id": "conv_456",
                "usage": {"total_tokens": 20},
                "full_response": "First sentence. Second sentence! Third sentence?\nFinal text.",
            }

        mock_ai = MagicMock()
        mock_ai.achat_stream = mock_stream

        result = await manager.deliver(
            provider="telegram",
            chat_id="chat_123",
            ai_client=mock_ai,
            prompt="Test",
            conversation_id=None,
            provider_meta={},
        )

        assert result.was_streaming is True
        assert "First sentence" in result.response_text
        assert result.edit_count > 0

    @pytest.mark.asyncio
    async def test_long_response_chunking(self, manager, mock_messaging_client):
        long_text = "A" * 250
        chunk_size = 100
        mock_messaging_client.chunk_text = MagicMock(
            side_effect=lambda text, provider=None: [text[i : i + chunk_size] for i in range(0, len(text), chunk_size)]
        )
        mock_messaging_client.send_message.return_value = MagicMock(
            success=True, message_id="msg_new", error=None, raw={}
        )

        async def mock_stream(*args, **kwargs):
            yield {"__conversation_id__": "conv_789"}
            yield long_text
            yield {
                "__done__": True,
                "conversation_id": "conv_789",
                "usage": {"total_tokens": 100},
                "full_response": long_text,
            }

        mock_ai = MagicMock()
        mock_ai.achat_stream = mock_stream

        result = await manager.deliver(
            provider="telegram",
            chat_id="chat_123",
            ai_client=mock_ai,
            prompt="Test",
            conversation_id=None,
            provider_meta={},
        )

        assert len(result.message_ids) > 1

    @pytest.mark.asyncio
    async def test_stream_error_updates_placeholder(self, manager, mock_messaging_client):
        async def mock_stream(*args, **kwargs):
            yield {"__conversation_id__": "conv_err"}
            yield "Partial"
            raise RuntimeError("Stream broke")

        mock_ai = MagicMock()
        mock_ai.achat_stream = mock_stream

        result = await manager.deliver(
            provider="telegram",
            chat_id="chat_123",
            ai_client=mock_ai,
            prompt="Test",
            conversation_id=None,
            provider_meta={},
        )

        assert result.error is not None
        assert "Stream broke" in result.error
        assert result.response_text == "Partial"

    @pytest.mark.asyncio
    async def test_debounce_interval_property(self, manager):
        assert manager.edit_debounce_interval == 0.1
        manager.edit_debounce_interval = 0.5
        assert manager.edit_debounce_interval == 0.5
        manager.edit_debounce_interval = 0.01
        assert manager.edit_debounce_interval == 0.1
