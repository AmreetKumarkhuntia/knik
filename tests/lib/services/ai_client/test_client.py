"""AIClient failures and token totals: a failed provider call raises instead of passing for a reply."""

import asyncio

import pytest

from lib.services.ai_client import titles
from lib.services.ai_client.client import AIClient
from lib.services.ai_client.compaction import ConversationCompactor
from lib.services.ai_client.factory import build_client
from lib.services.ai_client.settings import ClientSettings
from lib.services.ai_client.stream_events import StreamDone
from lib.services.db import ConversationDB
from tests.db_support import requires_db


def _failing_client() -> AIClient:
    client = build_client(ClientSettings(provider="mock"))

    def chat(**kwargs):
        raise RuntimeError("quota exceeded")

    client._provider.chat = chat
    return client


def test_chat_raises_when_the_provider_fails():
    client = _failing_client()
    client.last_usage = {"total_tokens": 1}

    with pytest.raises(RuntimeError, match="quota exceeded"):
        client.chat(prompt="hi")

    assert client.last_usage is None


def test_a_provider_switch_during_a_stream_keeps_that_streams_usage():
    client = build_client(ClientSettings(provider="mock"))
    events = client.stream_events("hello")
    next(events)

    # What a bot /model or /provider does while that user's reply is still streaming.
    client.set_provider("mock")
    rest = list(events)

    assert rest
    assert client.last_usage == {"input_tokens": 10, "output_tokens": len(rest) + 1, "total_tokens": 11 + len(rest)}


@pytest.mark.asyncio
async def test_a_failed_title_call_leaves_the_conversation_untitled(monkeypatch):
    saved: list[tuple[str, str]] = []

    class Conversations:
        @staticmethod
        async def update_title(conversation_id, title):
            saved.append((conversation_id, title))

    monkeypatch.setattr(titles, "ConversationDB", Conversations)

    title = await titles.generate_and_set_title("conv-1", "hello", ai_client=_failing_client())

    assert title is None
    assert saved == []


@requires_db
@pytest.mark.asyncio
async def test_a_failed_compaction_call_saves_no_summary(db, monkeypatch):
    monkeypatch.setattr("lib.services.ai_client.compaction.count_message_tokens", lambda messages, model: 1)
    conversation_id = await ConversationDB.create_conversation()
    await ConversationDB.append_message(conversation_id, "user", "hello")
    await ConversationDB.append_message(conversation_id, "assistant", "hi")

    compacted = await ConversationCompactor(_failing_client(), "mock-model").compact(conversation_id)

    assert compacted is False
    assert [m.content for m in await ConversationDB.get_messages(conversation_id)] == ["hello", "hi"]
    assert await ConversationDB.get_compaction_state(conversation_id) == (None, 1)


@requires_db
@pytest.mark.asyncio
async def test_streamed_turns_add_up_in_the_conversation_total(db):
    client = build_client(ClientSettings(provider="mock"))

    first = [event async for event in client.achat_stream("hello")][-1]
    second = [event async for event in client.achat_stream("again", conversation_id=first.conversation_id)][-1]
    await asyncio.gather(*AIClient._background_tasks)

    assert isinstance(first, StreamDone) and isinstance(second, StreamDone)
    assert first.conversation_id == second.conversation_id
    usage = await ConversationDB.get_conversation_token_usage(first.conversation_id)
    assert usage["db_total"] == first.usage["total_tokens"] + second.usage["total_tokens"] > 0
    assert usage["db_total"] == usage["total"]
