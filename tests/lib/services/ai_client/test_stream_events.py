"""Tests for the typed chat stream: what the LangChain provider, stream_events, chat_stream and achat_stream yield.

A scripted agent stands in for the LangChain agent, so nothing touches the network, and achat_stream's database
steps are stubbed on the client.
"""

from types import SimpleNamespace

import pytest
from langchain_core.messages import AIMessage, ToolMessage

from lib.services.ai_client.client import AIClient
from lib.services.ai_client.providers.base_provider import LangChainProvider
from lib.services.ai_client.providers.mock_provider import MockAIProvider
from lib.services.ai_client.stream_events import (
    ConversationReady,
    StreamDone,
    StreamError,
    TextDelta,
    ToolCallFinished,
    ToolCallStarted,
)


USAGE = {"input_tokens": 7, "output_tokens": 3, "total_tokens": 10}


class ScriptedAgent:
    """Streams its messages the way a LangGraph agent does in "messages" mode, raising at index `fail_at`."""

    def __init__(self, messages, fail_at: int | None = None) -> None:
        self.messages = messages
        self.fail_at = fail_at

    def stream(self, inputs, stream_mode=None, **kwargs):
        for i, message in enumerate(self.messages):
            if i == self.fail_at:
                raise RuntimeError("agent exploded")
            yield message, {}


def _messages():
    return [
        AIMessage(content="Let me look", tool_calls=[{"name": "shell_execute", "args": {"cmd": "ls"}, "id": "call_1"}]),
        ToolMessage(content="x" * 300, tool_call_id="call_1", name="shell_execute"),
        AIMessage(
            content=[{"type": "text", "text": "Two "}, {"type": "image_url"}, {"type": "text", "text": "files."}],
            usage_metadata=USAGE,
        ),
    ]


EVENTS = [
    TextDelta("Let me look"),
    ToolCallStarted("shell_execute", "call_1", {"cmd": "ls"}),
    ToolCallFinished("shell_execute", "call_1", "x" * 200),
    TextDelta("Two "),
    TextDelta("files."),
]


def _provider(messages, fail_at: int | None = None) -> LangChainProvider:
    return LangChainProvider(
        llm=SimpleNamespace(model_name="scripted"), agent=ScriptedAgent(messages, fail_at), provider_name="scripted"
    )


def _client(messages, fail_at: int | None = None) -> AIClient:
    client = AIClient(provider="mock")
    client._provider = _provider(messages, fail_at)
    return client


def test_provider_streams_text_and_tool_calls_as_typed_events():
    assert list(_provider(_messages()).chat_stream("hi")) == EVENTS


def test_tool_result_for_an_unknown_call_still_finishes_it():
    messages = [ToolMessage(content="", tool_call_id="call_9", name="utils_calc")]

    assert list(_provider(messages).chat_stream("hi")) == [ToolCallFinished("utils_calc", "call_9", "")]


def test_mock_provider_streams_text_deltas():
    events = list(MockAIProvider().chat_stream("hi"))

    assert all(isinstance(event, TextDelta) for event in events)
    assert "".join(event.text for event in events) == "Mock AI response. Configure Vertex AI for real responses. "


def test_stream_events_passes_provider_events_on_and_records_usage():
    client = _client(_messages())

    assert list(client.stream_events("hi")) == EVENTS
    assert client.last_usage == USAGE


def test_provider_failure_ends_the_stream_with_a_stream_error():
    client = _client(_messages(), fail_at=2)

    assert list(client.stream_events("hi")) == [*EVENTS[:3], StreamError("Chat streaming error: agent exploded")]
    assert client.last_usage is None


def test_chat_stream_yields_only_the_text():
    assert list(_client(_messages()).chat_stream("hi")) == ["Let me look", "Two ", "files."]
    assert list(_client(_messages(), fail_at=2).chat_stream("hi")) == [
        "Let me look",
        "Chat streaming error: agent exploded",
    ]


def _stub_database(client: AIClient, conversation_id: str | None) -> list[str]:
    """Stubs achat_stream's database steps on the client; returns the list of reply texts it saves."""
    saved: list[str] = []

    async def ensure(_conversation_id, **_owner):
        return conversation_id

    async def append(*args):
        return None

    async def load(*args):
        return []

    async def post_chat(**kwargs):
        saved.append(kwargs["response_text"])

    client._ensure_conversation = ensure
    client._append_message = append
    client._load_history = load
    client._post_chat = post_chat
    return saved


@pytest.mark.asyncio
async def test_achat_stream_puts_the_events_between_conversation_ready_and_stream_done():
    client = _client(_messages())
    saved = _stub_database(client, "conv-1")

    events = [event async for event in client.achat_stream("hi")]

    assert events == [
        ConversationReady("conv-1"),
        *EVENTS,
        StreamDone(conversation_id="conv-1", usage=USAGE, full_response="Let me lookTwo files."),
    ]
    assert saved == ["Let me lookTwo files."]


@pytest.mark.asyncio
async def test_achat_stream_counts_a_stream_error_as_reply_text():
    client = _client(_messages(), fail_at=2)
    saved = _stub_database(client, "conv-1")

    events = [event async for event in client.achat_stream("hi")]

    reply = "Let me lookChat streaming error: agent exploded"
    assert events[-2:] == [
        StreamError("Chat streaming error: agent exploded"),
        StreamDone(conversation_id="conv-1", usage=None, full_response=reply),
    ]
    assert saved == [reply]


@pytest.mark.asyncio
async def test_achat_stream_without_a_database_sends_no_conversation_and_saves_nothing():
    client = _client(_messages())
    saved = _stub_database(client, None)

    events = [event async for event in client.achat_stream("hi")]

    assert events == [*EVENTS, StreamDone(conversation_id=None, usage=USAGE, full_response="Let me lookTwo files.")]
    assert saved == []
