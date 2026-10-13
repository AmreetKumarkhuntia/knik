"""Tests for StreamingResponseManager."""

from unittest.mock import MagicMock

import pytest

from bot.streaming import StreamingResponseManager


@pytest.fixture
def manager(transport):
    return StreamingResponseManager(transport=transport, config=MagicMock())


def _make_ai_client(chunks):
    client = MagicMock()

    async def mock_stream(*args, **kwargs):
        for chunk in chunks:
            yield chunk

    client.achat_stream = mock_stream
    return client


async def _deliver(manager, chunks, **kwargs):
    return await manager.deliver(
        chat_id="chat_123",
        ai_client=_make_ai_client(chunks),
        prompt="Hello",
        conversation_id=None,
        **kwargs,
    )


class TestStreamingResponseManager:
    @pytest.mark.asyncio
    async def test_deliver_streams_text_and_returns_result(self, manager, transport):
        result = await _deliver(
            manager,
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
            ],
        )

        assert result.response_text == "Hello world!"
        assert result.conversation_id == "conv_123"
        assert result.usage == {"total_tokens": 15}
        assert result.error is None
        assert [(s.chat_id, s.text) for s in transport.streams] == [("chat_123", "Hello world!")]

    @pytest.mark.asyncio
    async def test_deliver_passes_send_options(self, manager, transport):
        await _deliver(
            manager,
            [
                "text",
                {"__tool_call_start__": True, "tool_name": "tool_a", "tool_args": {}},
                {"__done__": True, "conversation_id": "conv_123", "usage": {}, "full_response": "text"},
            ],
            send_options={"parse_mode": "Markdown"},
        )

        assert transport.streams[0].kwargs == {"parse_mode": "Markdown"}
        assert transport.messages[0].kwargs == {"parse_mode": "Markdown"}

    @pytest.mark.asyncio
    async def test_deliver_captures_conversation_id_from_done_sentinel(self, manager):
        result = await _deliver(
            manager,
            [
                {"__conversation_id__": "conv_early"},
                "text",
                {"__done__": True, "conversation_id": "conv_final", "usage": {}, "full_response": "text"},
            ],
        )

        assert result.conversation_id == "conv_final"

    @pytest.mark.asyncio
    async def test_deliver_returns_error_on_exception(self, manager, transport):
        transport.stream_error = RuntimeError("broken")

        result = await _deliver(
            manager,
            ["hello", {"__done__": True, "conversation_id": "c1", "usage": {}, "full_response": "hello"}],
        )

        assert result.error is not None
        assert "broken" in result.error

    @pytest.mark.asyncio
    async def test_deliver_handles_empty_response(self, manager, transport):
        result = await _deliver(
            manager,
            [
                {"__conversation_id__": "conv_empty"},
                {"__done__": True, "conversation_id": "conv_empty", "usage": None, "full_response": ""},
            ],
        )

        assert result.response_text == ""
        assert transport.streams == []

    @pytest.mark.asyncio
    async def test_deliver_returns_message_ids_from_send_stream(self, manager, transport):
        transport.stream_message_ids = ["final_msg_999"]

        result = await _deliver(
            manager,
            ["hi", {"__done__": True, "conversation_id": "c1", "usage": {}, "full_response": "hi"}],
        )

        assert result.message_ids == ["final_msg_999"]

    @pytest.mark.asyncio
    async def test_deliver_handles_no_message_id(self, manager, transport):
        transport.stream_message_ids = [None]

        result = await _deliver(
            manager,
            ["hi", {"__done__": True, "conversation_id": "c1", "usage": {}, "full_response": "hi"}],
        )

        assert result.message_ids == []


class TestSegmentedDelivery:
    @pytest.mark.asyncio
    async def test_tool_call_splits_into_segments(self, manager, transport):
        result = await _deliver(
            manager,
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
            ],
        )

        assert [s.text for s in transport.streams] == ["Before tool. ", "After tool."]
        assert [m.text for m in transport.messages] == [
            "\U0001f527 Calling shell_execute(cmd='ls')...",
            "✓ shell_execute completed",
        ]
        assert result.error is None

    @pytest.mark.asyncio
    async def test_tool_without_output_says_so(self, manager, transport):
        await _deliver(
            manager,
            [
                {"__tool_call_start__": True, "tool_name": "tool_a", "tool_args": {}},
                {"__tool_call_end__": True, "tool_name": "tool_a", "tool_result_preview": ""},
                {"__done__": True, "conversation_id": "c1", "usage": {}, "full_response": ""},
            ],
        )

        assert transport.messages[-1].text == "✓ tool_a completed (no output)"

    @pytest.mark.asyncio
    async def test_multiple_tool_calls(self, manager, transport):
        result = await _deliver(
            manager,
            [
                "Seg 1. ",
                {"__tool_call_start__": True, "tool_name": "tool_a", "tool_args": {}},
                {"__tool_call_end__": True, "tool_name": "tool_a", "tool_result_preview": "ok"},
                "Seg 2. ",
                {"__tool_call_start__": True, "tool_name": "tool_b", "tool_args": {}},
                {"__tool_call_end__": True, "tool_name": "tool_b", "tool_result_preview": "done"},
                "Seg 3.",
                {"__done__": True, "conversation_id": "c1", "usage": {}, "full_response": "Seg 1. Seg 2. Seg 3."},
            ],
        )

        assert [s.text for s in transport.streams] == ["Seg 1. ", "Seg 2. ", "Seg 3."]
        assert result.message_ids == ["stream_1", "msg_1", "msg_2", "stream_2", "msg_3", "msg_4", "stream_3"]
        assert result.error is None

    @pytest.mark.asyncio
    async def test_no_text_before_tool_call_no_empty_segment(self, manager, transport):
        result = await _deliver(
            manager,
            [
                {"__tool_call_start__": True, "tool_name": "tool_a", "tool_args": {}},
                {"__tool_call_end__": True, "tool_name": "tool_a", "tool_result_preview": "ok"},
                "Only segment.",
                {"__done__": True, "conversation_id": "c1", "usage": {}, "full_response": "Only segment."},
            ],
        )

        assert result.error is None
        assert [s.text for s in transport.streams] == ["Only segment."]

    @pytest.mark.asyncio
    async def test_no_text_after_last_tool_call_no_empty_segment(self, manager, transport):
        result = await _deliver(
            manager,
            [
                "Only segment.",
                {"__tool_call_start__": True, "tool_name": "tool_a", "tool_args": {}},
                {"__tool_call_end__": True, "tool_name": "tool_a", "tool_result_preview": "ok"},
                {"__done__": True, "conversation_id": "c1", "usage": {}, "full_response": "Only segment."},
            ],
        )

        assert result.error is None
        assert [s.text for s in transport.streams] == ["Only segment."]
