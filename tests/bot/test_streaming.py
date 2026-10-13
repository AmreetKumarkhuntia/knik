"""Tests for StreamingResponseManager."""

from unittest.mock import MagicMock, patch

import pytest

from bot.streaming import StreamingResponseManager
from lib.services.ai_client.stream_events import (
    ConversationReady,
    StreamDone,
    StreamError,
    TextDelta,
    ToolCallFinished,
    ToolCallStarted,
)


@pytest.fixture
def manager(transport):
    return StreamingResponseManager(transport=transport, config=MagicMock())


def _make_ai_client(events):
    client = MagicMock()

    async def mock_stream(*args, **kwargs):
        for event in events:
            yield event

    client.achat_stream = mock_stream
    return client


async def _deliver(manager, events, **kwargs):
    return await manager.deliver(
        chat_id="chat_123",
        ai_client=_make_ai_client(events),
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
                ConversationReady("conv_123"),
                TextDelta("Hello"),
                TextDelta(" world"),
                TextDelta("!"),
                StreamDone(conversation_id="conv_123", usage={"total_tokens": 15}, full_response="Hello world!"),
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
                TextDelta("text"),
                ToolCallStarted("tool_a", "call_tool_a", {}),
                StreamDone(conversation_id="conv_123", usage={}, full_response="text"),
            ],
            send_options={"parse_mode": "Markdown"},
        )

        assert transport.streams[0].kwargs == {"parse_mode": "Markdown"}
        assert transport.messages[0].kwargs == {"parse_mode": "Markdown"}

    @pytest.mark.asyncio
    async def test_deliver_takes_conversation_id_from_stream_done(self, manager):
        result = await _deliver(
            manager,
            [
                ConversationReady("conv_early"),
                TextDelta("text"),
                StreamDone(conversation_id="conv_final", usage={}, full_response="text"),
            ],
        )

        assert result.conversation_id == "conv_final"

    @pytest.mark.asyncio
    async def test_deliver_returns_error_on_exception(self, manager, transport):
        transport.stream_error = RuntimeError("broken")

        result = await _deliver(
            manager,
            [TextDelta("hello"), StreamDone(conversation_id="c1", usage={}, full_response="hello")],
        )

        assert result.error is not None
        assert "broken" in result.error

    @pytest.mark.asyncio
    async def test_deliver_handles_empty_response(self, manager, transport):
        result = await _deliver(
            manager,
            [
                ConversationReady("conv_empty"),
                StreamDone(conversation_id="conv_empty", usage=None, full_response=""),
            ],
        )

        assert result.response_text == ""
        assert transport.streams == []

    @pytest.mark.asyncio
    async def test_deliver_returns_message_ids_from_send_stream(self, manager, transport):
        transport.stream_message_ids = ["final_msg_999"]

        result = await _deliver(
            manager,
            [TextDelta("hi"), StreamDone(conversation_id="c1", usage={}, full_response="hi")],
        )

        assert result.message_ids == ["final_msg_999"]

    @pytest.mark.asyncio
    async def test_deliver_handles_no_message_id(self, manager, transport):
        transport.stream_message_ids = [None]

        result = await _deliver(
            manager,
            [TextDelta("hi"), StreamDone(conversation_id="c1", usage={}, full_response="hi")],
        )

        assert result.message_ids == []

    @pytest.mark.asyncio
    async def test_a_reply_the_transport_failed_to_send_is_not_reported_as_delivered(self, manager, transport):
        transport.stream_failure = "Forbidden: bot was blocked by the user"

        result = await _deliver(
            manager,
            [
                ConversationReady("c1"),
                TextDelta("hi"),
                StreamDone(conversation_id="c1", usage={"total_tokens": 3}, full_response="hi"),
            ],
        )

        assert result.send_errors == ["Forbidden: bot was blocked by the user"]
        assert not result.delivered
        assert result.message_ids == []
        assert (result.error, result.conversation_id, result.response_text) == (None, "c1", "hi")

    @pytest.mark.asyncio
    async def test_a_tool_notice_that_failed_to_send_is_logged_but_the_reply_is_delivered(self, manager, transport):
        # The tools have run by then, so reporting the reply as lost would have the user run them again.
        transport.send_failure = "Too Many Requests: retry after 5"

        with patch("bot.streaming.printer") as printer:
            result = await _deliver(
                manager,
                [
                    ToolCallStarted("tool_a", "call_tool_a", {}),
                    ToolCallFinished("tool_a", "call_tool_a", "ok"),
                    TextDelta("done"),
                    StreamDone(conversation_id="c1", usage={}, full_response="done"),
                ],
            )

        assert result.message_ids == ["stream_1"]
        assert (result.send_errors, result.delivered) == ([], True)
        assert printer.warning.call_count == 2
        assert "Too Many Requests: retry after 5" in printer.warning.call_args.args[0]

    @pytest.mark.asyncio
    async def test_a_fully_sent_reply_is_delivered(self, manager):
        result = await _deliver(
            manager, [TextDelta("hi"), StreamDone(conversation_id="c1", usage={}, full_response="hi")]
        )

        assert (result.send_errors, result.delivered) == ([], True)

    @pytest.mark.asyncio
    async def test_stream_error_is_sent_as_reply_text(self, manager, transport):
        result = await _deliver(
            manager,
            [
                TextDelta("Partial. "),
                StreamError("Chat streaming error: boom"),
                StreamDone(conversation_id="c1", usage=None, full_response="Partial. Chat streaming error: boom"),
            ],
        )

        assert [s.text for s in transport.streams] == ["Partial. Chat streaming error: boom"]
        assert result.response_text == "Partial. Chat streaming error: boom"
        assert result.error is None


class TestSegmentedDelivery:
    @pytest.mark.asyncio
    async def test_tool_call_splits_into_segments(self, manager, transport):
        result = await _deliver(
            manager,
            [
                ConversationReady("conv_1"),
                TextDelta("Before tool. "),
                ToolCallStarted("shell_execute", "call_shell_execute", {"cmd": "ls"}),
                ToolCallFinished("shell_execute", "call_shell_execute", "file1.txt"),
                TextDelta("After tool."),
                StreamDone(conversation_id="conv_1", usage={}, full_response="Before tool. After tool."),
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
                ToolCallStarted("tool_a", "call_tool_a", {}),
                ToolCallFinished("tool_a", "call_tool_a", ""),
                StreamDone(conversation_id="c1", usage={}, full_response=""),
            ],
        )

        assert transport.messages[-1].text == "✓ tool_a completed (no output)"

    @pytest.mark.asyncio
    async def test_multiple_tool_calls(self, manager, transport):
        result = await _deliver(
            manager,
            [
                TextDelta("Seg 1. "),
                ToolCallStarted("tool_a", "call_tool_a", {}),
                ToolCallFinished("tool_a", "call_tool_a", "ok"),
                TextDelta("Seg 2. "),
                ToolCallStarted("tool_b", "call_tool_b", {}),
                ToolCallFinished("tool_b", "call_tool_b", "done"),
                TextDelta("Seg 3."),
                StreamDone(conversation_id="c1", usage={}, full_response="Seg 1. Seg 2. Seg 3."),
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
                ToolCallStarted("tool_a", "call_tool_a", {}),
                ToolCallFinished("tool_a", "call_tool_a", "ok"),
                TextDelta("Only segment."),
                StreamDone(conversation_id="c1", usage={}, full_response="Only segment."),
            ],
        )

        assert result.error is None
        assert [s.text for s in transport.streams] == ["Only segment."]

    @pytest.mark.asyncio
    async def test_whitespace_around_tool_calls_opens_no_segment(self, manager, transport):
        result = await _deliver(
            manager,
            [
                TextDelta("\n\n"),
                ToolCallStarted("read_file", "call_read_file", {"path": "a"}),
                ToolCallFinished("read_file", "call_read_file", "x"),
                TextDelta(" "),
                TextDelta("\n"),
                ToolCallStarted("read_file", "call_read_file", {"path": "b"}),
                ToolCallFinished("read_file", "call_read_file", "y"),
                TextDelta("\n"),
                TextDelta("Here is the file summary."),
                StreamDone(conversation_id="c1", usage={}, full_response="\n\n \n\nHere is the file summary."),
            ],
        )

        assert [s.text for s in transport.streams] == ["Here is the file summary."]
        assert result.message_ids == ["msg_1", "msg_2", "msg_3", "msg_4", "stream_1"]
        assert result.delivered

    @pytest.mark.asyncio
    async def test_no_text_after_last_tool_call_no_empty_segment(self, manager, transport):
        result = await _deliver(
            manager,
            [
                TextDelta("Only segment."),
                ToolCallStarted("tool_a", "call_tool_a", {}),
                ToolCallFinished("tool_a", "call_tool_a", "ok"),
                StreamDone(conversation_id="c1", usage={}, full_response="Only segment."),
            ],
        )

        assert result.error is None
        assert [s.text for s in transport.streams] == ["Only segment."]


@pytest.mark.asyncio
async def test_a_conversation_the_reply_starts_belongs_to_the_telegram_user(manager):
    calls: list[dict] = []
    client = MagicMock()

    async def achat_stream(**kwargs):
        calls.append(kwargs)
        yield StreamDone(conversation_id="conv_1", usage=None, full_response="")

    client.achat_stream = achat_stream

    await manager.deliver(chat_id="chat_123", ai_client=client, prompt="Hello", conversation_id=None, user_id="usr_1")

    assert calls == [{"prompt": "Hello", "conversation_id": None, "user_id": "usr_1", "source": "telegram"}]
