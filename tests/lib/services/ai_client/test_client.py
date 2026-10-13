"""AIClient failures and token totals: a failed provider call raises instead of passing for a reply."""

import asyncio

import pytest

from lib.services.ai_client import titles
from lib.services.ai_client.client import AIClient
from lib.services.ai_client.compaction import ConversationCompactor
from lib.services.ai_client.factory import build_client
from lib.services.ai_client.settings import ClientSettings
from lib.services.ai_client.stream_events import ConversationReady, StreamDone
from lib.services.db import ConversationDB, DatabaseUnavailable, PostgresDB, UserDB
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


class _Conversations:
    """Records the conversations _ensure_conversation creates; `unavailable` makes it fail like a stopped Postgres."""

    def __init__(self, existing: tuple[str, ...] = (), unavailable: bool = False) -> None:
        self.existing = existing
        self.unavailable = unavailable
        self.created: list[dict] = []

    async def get_conversation(self, conversation_id):
        if self.unavailable:
            raise DatabaseUnavailable("down")
        return object() if conversation_id in self.existing else None

    async def create_conversation(self, title=None, **owner):
        if self.unavailable:
            raise DatabaseUnavailable("down")
        self.created.append(owner)
        return f"conv-{len(self.created)}"


@pytest.mark.asyncio
async def test_a_conversation_is_created_with_the_owner_and_source_given(monkeypatch):
    conversations = _Conversations(existing=("conv-old",))
    monkeypatch.setattr("lib.services.ai_client.client.ConversationDB", conversations)

    created = await AIClient._ensure_conversation(None, user_id="usr_1", source="telegram")
    kept = await AIClient._ensure_conversation("conv-old", user_id="usr_1", source="telegram")
    unowned = await AIClient._ensure_conversation(None)

    assert (created, kept, unowned) == ("conv-1", "conv-old", "conv-2")
    assert conversations.created == [{"user_id": "usr_1", "source": "telegram"}, {"user_id": None, "source": None}]
    monkeypatch.setattr(conversations, "unavailable", True)
    assert await AIClient._ensure_conversation(None, user_id="usr_1", source="telegram") is None


@requires_db
@pytest.mark.asyncio
async def test_achat_and_achat_stream_record_the_owner_and_source_of_a_new_conversation(db):
    client = build_client(ClientSettings(provider="mock"))
    user = await UserDB.get_or_create("telegram", "42")

    _, chatted, _ = await client.achat("hello", user_id=user.id, source="telegram")
    streamed = [event async for event in client.achat_stream("hello", source="web")][-1].conversation_id
    # A conversation that exists keeps its owner, whoever continues it.
    _, continued, _ = await client.achat("again", conversation_id=streamed, user_id=user.id, source="telegram")
    await asyncio.gather(*AIClient._background_tasks)

    owners = {cid: await ConversationDB.get_conversation(cid) for cid in (chatted, streamed)}
    assert continued == streamed
    assert {cid: (c.user_id, c.source) for cid, c in owners.items()} == {
        chatted: (user.id, "telegram"),
        streamed: (None, "web"),
    }


async def _conversation_ids() -> set[str]:
    return {row["id"] for row in await PostgresDB.fetch_all("SELECT id FROM conversations")}


@requires_db
@pytest.mark.asyncio
async def test_a_failed_reply_leaves_no_conversation_its_caller_never_got(db):
    client = _failing_client()

    # A new conversation, and the one an unknown id starts in its place.
    for conversation_id in (None, "gone"):
        with pytest.raises(RuntimeError, match="quota exceeded"):
            await client.achat("hello", conversation_id=conversation_id, source="web")

    assert await _conversation_ids() == set()


@requires_db
@pytest.mark.asyncio
async def test_a_failed_reply_keeps_the_conversation_given_and_a_retry_still_titles_it(db):
    conversation_id = await ConversationDB.create_conversation(source="web")

    with pytest.raises(RuntimeError, match="quota exceeded"):
        await _failing_client().achat("hello", conversation_id=conversation_id)
    _, continued, _ = await build_client(ClientSettings(provider="mock")).achat(
        "hello", conversation_id=conversation_id
    )
    await asyncio.gather(*AIClient._background_tasks)

    conversation = await ConversationDB.get_conversation(conversation_id)
    assert continued == conversation_id
    assert [m.role for m in conversation.messages] == ["user", "user", "assistant"]
    assert conversation.title


@requires_db
@pytest.mark.asyncio
async def test_a_failed_streamed_reply_is_saved_in_the_conversation_whose_id_it_sent(db):
    client = build_client(ClientSettings(provider="mock"))

    def chat_stream(**kwargs):
        raise RuntimeError("quota exceeded")
        yield

    client._provider.chat_stream = chat_stream

    events = [event async for event in client.achat_stream("hello", source="web")]

    ready, done = events[0], events[-1]
    assert isinstance(ready, ConversationReady) and isinstance(done, StreamDone)
    assert done.conversation_id == ready.conversation_id
    assert await _conversation_ids() == {ready.conversation_id}
    messages = await ConversationDB.get_messages(ready.conversation_id)
    assert [(m.role, m.content) for m in messages] == [
        ("user", "hello"),
        ("assistant", "Chat streaming error: quota exceeded"),
    ]


@requires_db
@pytest.mark.asyncio
async def test_without_persistence_a_chat_answers_and_neither_reads_nor_writes_a_conversation(db):
    conversation_id = await ConversationDB.create_conversation(source="web")
    client = build_client(ClientSettings(provider="mock"))

    text, chatted, _ = await client.achat("hello", conversation_id=conversation_id, persist=False)
    events = [event async for event in client.achat_stream("hello", conversation_id=conversation_id, persist=False)]

    assert text and chatted is None
    assert not [event for event in events if isinstance(event, ConversationReady)]
    assert events[-1].conversation_id is None and events[-1].full_response
    assert await _conversation_ids() == {conversation_id}
    assert await ConversationDB.get_message_count(conversation_id) == 0
