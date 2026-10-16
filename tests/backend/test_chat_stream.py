"""The streaming chat route: each stream event becomes one SSE frame, in the wire format the web client reads.

A stub client yields scripted events, so these pin the exact bytes the backend sends for each kind of event.
"""

import contextlib
from types import SimpleNamespace

import numpy as np
import pytest

from backend.main import app
from backend.routes import chat_stream
from lib.services.ai_client.stream_events import (
    ConversationReady,
    StreamDone,
    StreamError,
    TextDelta,
    ToolCallFinished,
    ToolCallStarted,
)


USAGE = {"input_tokens": 100, "output_tokens": 20, "total_tokens": 120}


class StubClient:
    tool_registry = None

    def __init__(self, events, error: Exception | None = None) -> None:
        self.events = events
        self.error = error

    async def achat_stream(self, prompt, **kwargs):
        for event in self.events:
            yield event
        if self.error is not None:
            raise self.error


class StubConversationDB:
    """Hands out compaction pointers in turn: one read before the stream (only for a known conversation), one after."""

    def __init__(self, *summary_message_ids: str | None) -> None:
        self.summary_message_ids = list(summary_message_ids)

    async def get_compaction_state(self, conversation_id):
        return self.summary_message_ids.pop(0), None


class StubTTS:
    def generate(self, sentence):
        return np.zeros(4, dtype=np.float32), 24000


class StubState:
    """The parts of AppState the route uses; records the conversation ids it caches a client under."""

    def __init__(self, config, tts=None) -> None:
        self.settings = SimpleNamespace(config=config)
        self.tts = tts
        self.ai_client: StubClient | None = None
        self.requested: list[str | None] = []
        self.cached: list[str] = []
        self.leases_open = 0

    @contextlib.asynccontextmanager
    async def client(self, conversation_id):
        client = await self.get_client(conversation_id)
        self.leases_open += 1
        try:
            yield client
        finally:
            self.leases_open -= 1

    async def get_client(self, conversation_id):
        self.requested.append(conversation_id)
        return self.ai_client

    def set_client(self, conversation_id, client) -> None:
        self.cached.append(conversation_id)


@pytest.fixture
def stub_state(config, monkeypatch) -> StubState:
    monkeypatch.setattr(chat_stream, "ConversationDB", StubConversationDB(None, None))
    return StubState(config)


@pytest.fixture
def cached(stub_state) -> list[str]:
    """The conversation ids the route caches its client under."""
    return stub_state.cached


async def _frames(state, client, conversation_id: str | None = None) -> list[str]:
    state.ai_client = client
    stream = chat_stream.stream_chat_response(state, "hello", conversation_id=conversation_id)
    frames = [frame async for frame in stream]
    assert state.leases_open == 0
    return frames


@pytest.mark.asyncio
async def test_every_event_kind_becomes_its_frame(monkeypatch, stub_state, cached):
    events = [
        ConversationReady("conv-1"),
        TextDelta("Let me look"),
        ToolCallStarted("shell_execute", "call_1", {"cmd": "ls -la", "n": 3}),
        ToolCallFinished("shell_execute", "call_1", 'a.txt\n"b" ✓'),
        ToolCallStarted("utils_calc", "call_2", {}),
        ToolCallFinished("utils_calc", None, ""),
        StreamError("Chat streaming error: boom"),
        StreamDone(conversation_id="conv-1", usage=USAGE, full_response="Let me lookChat streaming error: boom"),
    ]
    monkeypatch.setattr(chat_stream, "ConversationDB", StubConversationDB("summary-9"))

    assert await _frames(stub_state, StubClient(events)) == [
        'event: conversation_id\ndata: {"conversation_id": "conv-1"}\n\n',
        'event: text\ndata: {"text": "Let me look"}\n\n',
        'event: tool_start\ndata: {"tool_name": "shell_execute", "tool_args": {"cmd": "ls -la", "n": 3}}\n\n',
        'event: tool_end\ndata: {"tool_name": "shell_execute", "tool_result_preview": "a.txt\\n\\"b\\" \\u2713"}\n\n',
        'event: tool_start\ndata: {"tool_name": "utils_calc", "tool_args": {}}\n\n',
        'event: tool_end\ndata: {"tool_name": "utils_calc", "tool_result_preview": ""}\n\n',
        'event: text\ndata: {"text": "Chat streaming error: boom"}\n\n',
        'event: usage\ndata: {"usage": {"input_tokens": 100, "output_tokens": 20, "total_tokens": 120}}\n\n',
        'event: compaction\ndata: {"summary_message_id": "summary-9"}\n\n',
        'event: done\ndata: {"audio_count": 0}\n\n',
    ]
    assert cached == ["conv-1"]


@pytest.mark.asyncio
async def test_known_conversation_without_usage_or_compaction_sends_text_and_done(monkeypatch, stub_state, cached):
    events = [
        ConversationReady("conv-2"),
        TextDelta("Hi"),
        StreamDone(conversation_id="conv-2", usage=None, full_response="Hi"),
    ]
    monkeypatch.setattr(chat_stream, "ConversationDB", StubConversationDB("summary-1", "summary-1"))

    assert await _frames(stub_state, StubClient(events), "conv-2") == [
        'event: conversation_id\ndata: {"conversation_id": "conv-2"}\n\n',
        'event: text\ndata: {"text": "Hi"}\n\n',
        'event: done\ndata: {"audio_count": 0}\n\n',
    ]
    assert cached == []
    assert stub_state.requested == ["conv-2"]


@pytest.mark.asyncio
async def test_unfinished_sentence_is_spoken_before_done(stub_state):
    events = [TextDelta("Hello "), TextDelta("there"), StreamDone(conversation_id=None, usage=None, full_response="")]
    stub_state.tts = StubTTS()

    frames = await _frames(stub_state, StubClient(events))

    audio = chat_stream._encode_audio(np.zeros(4, dtype=np.float32), 24000)
    assert frames[2:] == [
        f'event: audio\ndata: {{"audio": "{audio}", "sample_rate": 24000}}\n\n',
        'event: done\ndata: {"audio_count": 1}\n\n',
    ]


@pytest.mark.asyncio
async def test_error_from_the_stream_becomes_an_error_frame(stub_state):
    client = StubClient([TextDelta("Hi")], error=RuntimeError("save failed"))

    assert await _frames(stub_state, client) == [
        'event: text\ndata: {"text": "Hi"}\n\n',
        'event: error\ndata: {"error": "save failed"}\n\n',
    ]


@pytest.mark.asyncio
async def test_a_client_that_cannot_be_built_becomes_an_error_frame(stub_state):
    async def get_client(conversation_id):
        raise RuntimeError("no provider")

    stub_state.get_client = get_client

    stream = chat_stream.stream_chat_response(stub_state, "hello", conversation_id="conv-1")
    assert [frame async for frame in stream] == ['event: error\ndata: {"error": "no provider"}\n\n']


def test_route_streams_the_frames_as_server_sent_events(monkeypatch, offline_client):
    events = [TextDelta("Hi"), StreamDone(conversation_id=None, usage=USAGE, full_response="Hi")]
    requested: list[str | None] = []

    async def get_client(conversation_id):
        requested.append(conversation_id)
        return StubClient(events)

    monkeypatch.setattr(app.state.knik, "get_client", get_client)

    response = offline_client.post("/api/chat/stream/", json={"message": "hello"})

    assert response.status_code == 200
    assert response.headers["content-type"] == "text/event-stream; charset=utf-8"
    assert (response.headers["cache-control"], response.headers["x-accel-buffering"]) == ("no-cache", "no")
    audio = chat_stream._encode_audio(np.zeros(4, dtype=np.float32), 24000)
    assert response.text == (
        'event: text\ndata: {"text": "Hi"}\n\n'
        f'event: audio\ndata: {{"audio": "{audio}", "sample_rate": 24000}}\n\n'
        'event: usage\ndata: {"usage": {"input_tokens": 100, "output_tokens": 20, "total_tokens": 120}}\n\n'
        'event: done\ndata: {"audio_count": 1}\n\n'
    )
    assert requested == [None]
