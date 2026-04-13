"""Tests for StreamingResponseManager."""

from unittest.mock import AsyncMock, MagicMock

import pytest

from src.apps.bot.streaming import StreamingResponseManager


async def _consume_stream(chat_id, text_stream, **kwargs):
    collected = ""
    async for chunk in text_stream:
        collected += chunk
    return MagicMock(success=True, message_id="msg_123", error=None)


@pytest.fixture
def mock_messaging_client():
    client = MagicMock()
    client.send_stream = AsyncMock(side_effect=_consume_stream)
    client.send_message = AsyncMock(return_value=MagicMock(success=True, message_id="notify_1", error=None))
    return client


@pytest.fixture
def mock_config():
    return MagicMock()


@pytest.fixture
def manager(mock_messaging_client, mock_config):
    return StreamingResponseManager(
        messaging_client=mock_messaging_client,
        config=mock_config,
    )


def _make_ai_client(chunks):
    client = MagicMock()

    async def mock_stream(*args, **kwargs):
        for chunk in chunks:
            yield chunk

    client.achat_stream = mock_stream
    return client


class TestStreamingResponseManager:
    @pytest.mark.asyncio
    async def test_deliver_streams_text_and_returns_result(self, manager, mock_messaging_client):
        ai_client = _make_ai_client(
            [
                {"__conversation_id__": "conv_123"},
                "Hello",
                " world",
                "!",
                {
                    "__done__": True,
                    "conversation_id": "conv_123",
                    "usage": {"total_tokens": 15},
                    "full_response": "Hello world!",
                },
            ]
        )

        result = await manager.deliver(
            provider="telegram",
            chat_id="chat_123",
            ai_client=ai_client,
            prompt="Hello",
            conversation_id=None,
            provider_meta={},
        )

        assert result.response_text == "Hello world!"
        assert result.conversation_id == "conv_123"
        assert result.usage == {"total_tokens": 15}
        assert result.error is None
        mock_messaging_client.send_stream.assert_called_once()

    @pytest.mark.asyncio
    async def test_deliver_passes_provider_meta(self, manager, mock_messaging_client):
        ai_client = _make_ai_client(
            [
                {"__conversation_id__": "conv_123"},
                "text",
                {"__done__": True, "conversation_id": "conv_123", "usage": {}, "full_response": "text"},
            ]
        )

        await manager.deliver(
            provider="telegram",
            chat_id="chat_123",
            ai_client=ai_client,
            prompt="Hello",
            conversation_id=None,
            provider_meta={"parse_mode": "Markdown"},
        )

        call_kwargs = mock_messaging_client.send_stream.call_args
        assert call_kwargs.kwargs["provider"] == "telegram"
        assert call_kwargs.kwargs["parse_mode"] == "Markdown"

    @pytest.mark.asyncio
    async def test_deliver_captures_conversation_id_from_early_sentinel(self, manager, mock_messaging_client):
        ai_client = _make_ai_client(
            [
                {"__conversation_id__": "conv_early"},
                "text",
                {"__done__": True, "conversation_id": "conv_final", "usage": {}, "full_response": "text"},
            ]
        )

        result = await manager.deliver(
            provider="telegram",
            chat_id="chat_123",
            ai_client=ai_client,
            prompt="Hi",
            conversation_id=None,
            provider_meta={},
        )

        assert result.conversation_id == "conv_final"

    @pytest.mark.asyncio
    async def test_deliver_returns_error_on_exception(self, manager, mock_messaging_client):
        mock_messaging_client.send_stream.side_effect = RuntimeError("broken")

        ai_client = _make_ai_client(
            [
                "hello",
                {"__done__": True, "conversation_id": "c1", "usage": {}, "full_response": "hello"},
            ]
        )

        result = await manager.deliver(
            provider="telegram",
            chat_id="chat_123",
            ai_client=ai_client,
            prompt="Hi",
            conversation_id=None,
            provider_meta={},
        )

        assert result.error is not None
        assert "broken" in result.error

    @pytest.mark.asyncio
    async def test_deliver_handles_empty_response(self, manager, mock_messaging_client):
        ai_client = _make_ai_client(
            [
                {"__conversation_id__": "conv_empty"},
                {"__done__": True, "conversation_id": "conv_empty", "usage": None, "full_response": ""},
            ]
        )

        result = await manager.deliver(
            provider="telegram",
            chat_id="chat_123",
            ai_client=ai_client,
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

        ai_client = _make_ai_client(
            [
                "hi",
                {"__done__": True, "conversation_id": "c1", "usage": {}, "full_response": "hi"},
            ]
        )

        result = await manager.deliver(
            provider="telegram",
            chat_id="chat_123",
            ai_client=ai_client,
            prompt="Hi",
            conversation_id=None,
            provider_meta={},
        )

        assert "final_msg_999" in result.message_ids

    @pytest.mark.asyncio
    async def test_deliver_handles_no_message_id(self, manager, mock_messaging_client):
        async def consume_and_return_none(chat_id, text_stream, **kwargs):
            async for _ in text_stream:
                pass
            return MagicMock(success=True, message_id=None, error=None)

        mock_messaging_client.send_stream.side_effect = consume_and_return_none

        ai_client = _make_ai_client(
            [
                "hi",
                {"__done__": True, "conversation_id": "c1", "usage": {}, "full_response": "hi"},
            ]
        )

        result = await manager.deliver(
            provider="telegram",
            chat_id="chat_123",
            ai_client=ai_client,
            prompt="Hi",
            conversation_id=None,
            provider_meta={},
        )

        assert result.message_ids == []


class TestSegmentedDelivery:
    @pytest.mark.asyncio
    async def test_tool_call_splits_into_segments(self, manager, mock_messaging_client):
        segments_collected = []

        async def capture_stream(chat_id, text_stream, **kwargs):
            collected = ""
            async for chunk in text_stream:
                collected += chunk
            segments_collected.append(collected)
            return MagicMock(success=True, message_id=f"msg_{len(segments_collected)}", error=None)

        mock_messaging_client.send_stream.side_effect = capture_stream

        ai_client = _make_ai_client(
            [
                {"__conversation_id__": "conv_1"},
                "Before tool. ",
                {"__tool_call_start__": True, "tool_name": "shell_execute", "tool_args": {"cmd": "ls"}},
                {"__tool_call_end__": True, "tool_name": "shell_execute", "tool_result_preview": "file1.txt"},
                "After tool.",
                {
                    "__done__": True,
                    "conversation_id": "conv_1",
                    "usage": {},
                    "full_response": "Before tool. After tool.",
                },
            ]
        )

        result = await manager.deliver(
            provider="telegram",
            chat_id="chat_123",
            ai_client=ai_client,
            prompt="Run ls",
            conversation_id=None,
            provider_meta={},
        )

        assert segments_collected == ["Before tool. ", "After tool."]
        assert mock_messaging_client.send_message.call_count >= 2
        assert result.error is None

    @pytest.mark.asyncio
    async def test_multiple_tool_calls(self, manager, mock_messaging_client):
        segments_collected = []

        async def capture_stream(chat_id, text_stream, **kwargs):
            collected = ""
            async for chunk in text_stream:
                collected += chunk
            segments_collected.append(collected)
            return MagicMock(success=True, message_id=f"msg_{len(segments_collected)}", error=None)

        mock_messaging_client.send_stream.side_effect = capture_stream

        ai_client = _make_ai_client(
            [
                "Seg 1. ",
                {"__tool_call_start__": True, "tool_name": "tool_a", "tool_args": {}},
                {"__tool_call_end__": True, "tool_name": "tool_a", "tool_result_preview": "ok"},
                "Seg 2. ",
                {"__tool_call_start__": True, "tool_name": "tool_b", "tool_args": {}},
                {"__tool_call_end__": True, "tool_name": "tool_b", "tool_result_preview": "done"},
                "Seg 3.",
                {"__done__": True, "conversation_id": "c1", "usage": {}, "full_response": "Seg 1. Seg 2. Seg 3."},
            ]
        )

        result = await manager.deliver(
            provider="telegram",
            chat_id="chat_123",
            ai_client=ai_client,
            prompt="Do stuff",
            conversation_id=None,
            provider_meta={},
        )

        assert segments_collected == ["Seg 1. ", "Seg 2. ", "Seg 3."]
        assert result.error is None

    @pytest.mark.asyncio
    async def test_no_text_before_tool_call_no_empty_segment(self, manager, mock_messaging_client):
        ai_client = _make_ai_client(
            [
                {"__tool_call_start__": True, "tool_name": "tool_a", "tool_args": {}},
                {"__tool_call_end__": True, "tool_name": "tool_a", "tool_result_preview": "ok"},
                "Only segment.",
                {"__done__": True, "conversation_id": "c1", "usage": {}, "full_response": "Only segment."},
            ]
        )

        result = await manager.deliver(
            provider="telegram",
            chat_id="chat_123",
            ai_client=ai_client,
            prompt="Run tool",
            conversation_id=None,
            provider_meta={},
        )

        assert result.error is None
        mock_messaging_client.send_stream.assert_called_once()

    @pytest.mark.asyncio
    async def test_no_text_after_last_tool_call_no_empty_segment(self, manager, mock_messaging_client):
        ai_client = _make_ai_client(
            [
                "Only segment.",
                {"__tool_call_start__": True, "tool_name": "tool_a", "tool_args": {}},
                {"__tool_call_end__": True, "tool_name": "tool_a", "tool_result_preview": "ok"},
                {"__done__": True, "conversation_id": "c1", "usage": {}, "full_response": "Only segment."},
            ]
        )

        result = await manager.deliver(
            provider="telegram",
            chat_id="chat_123",
            ai_client=ai_client,
            prompt="Run tool",
            conversation_id=None,
            provider_meta={},
        )

        assert result.error is None
        mock_messaging_client.send_stream.assert_called_once()
