"""ConversationDB against a real database."""

from datetime import UTC, datetime

import pytest

from lib.services.db import ConversationDB, PostgresDB
from tests.db_support import requires_db


pytestmark = [requires_db, pytest.mark.asyncio]


async def test_create_get_and_list(db):
    first = await ConversationDB.create_conversation("First")
    second = await ConversationDB.create_conversation()
    await ConversationDB.append_message(first, "user", "hello")
    await ConversationDB.append_message(first, "assistant", "x" * 300)

    conversation = await ConversationDB.get_conversation(first)
    assert conversation is not None
    assert conversation.title == "First"
    assert [m.role for m in conversation.messages] == ["user", "assistant"]
    assert conversation.message_count == 2

    listed = await ConversationDB.list_conversations()
    assert [c.id for c in listed] == [first, second]
    assert listed[0].messages == []
    assert listed[0].message_count == 2
    assert listed[0].preview == "x" * 200
    assert listed[1].message_count == 0
    assert listed[1].preview is None

    assert [c.id for c in await ConversationDB.list_conversations(limit=1, offset=1)] == [second]
    assert await ConversationDB.get_conversation("missing") is None


async def test_update_title_and_delete(db):
    conversation_id = await ConversationDB.create_conversation()
    assert await ConversationDB.update_title(conversation_id, "Renamed") is True
    assert (await ConversationDB.get_conversation(conversation_id)).title == "Renamed"
    assert await ConversationDB.update_title("missing", "x") is False

    assert await ConversationDB.delete_conversation(conversation_id) is True
    assert await ConversationDB.get_conversation(conversation_id) is None
    assert await ConversationDB.delete_conversation(conversation_id) is False


async def test_messages(db):
    conversation_id = await ConversationDB.create_conversation()
    for i in range(6):
        await ConversationDB.append_message(conversation_id, "user", f"m{i}", {"message_id": f"id{i}"})
    # Metadata json cannot encode is stored as its str() rather than failing the turn.
    await ConversationDB.append_message(conversation_id, "assistant", "m6", {"at": datetime(2026, 1, 1, tzinfo=UTC)})

    assert await ConversationDB.get_message_count(conversation_id) == 7
    assert await ConversationDB.get_message_count("missing") == 0

    messages = await ConversationDB.get_messages(conversation_id)
    assert [m.content for m in messages] == [f"m{i}" for i in range(7)]
    assert messages[0].metadata == {"message_id": "id0"}
    assert messages[6].metadata == {"at": "2026-01-01 00:00:00+00:00"}
    assert await ConversationDB.get_messages("missing") == []

    assert [m.content for m in await ConversationDB.get_recent_messages(conversation_id, last_n=2)] == ["m5", "m6"]
    assert len(await ConversationDB.get_recent_messages(conversation_id)) == 5
    assert len(await ConversationDB.get_recent_messages(conversation_id, last_n=50)) == 7

    from_id4 = await ConversationDB.get_messages_from(conversation_id, "id4")
    assert [m.content for m in from_id4] == ["m4", "m5", "m6"]
    assert len(await ConversationDB.get_messages_from(conversation_id, "unknown")) == 7
    assert await ConversationDB.get_messages_from("missing", "id4") == []


async def test_compaction_state(db):
    conversation_id = await ConversationDB.create_conversation()
    assert await ConversationDB.get_compaction_state(conversation_id) == (None, 0)
    assert await ConversationDB.get_compaction_state("missing") == (None, 0)

    assert await ConversationDB.increment_compacted_count(conversation_id) == 1
    assert await ConversationDB.increment_compacted_count(conversation_id) == 2
    assert await ConversationDB.increment_compacted_count("missing") == 0

    await ConversationDB.set_compaction_state(conversation_id, "summary-1", 0)
    assert await ConversationDB.get_compaction_state(conversation_id) == ("summary-1", 0)


async def test_token_usage(db):
    conversation_id = await ConversationDB.create_conversation()
    await ConversationDB.append_message(conversation_id, "user", "q")
    await ConversationDB.append_message(
        conversation_id,
        "assistant",
        "a1",
        {
            "usage": {
                "input_tokens": 10,
                "output_tokens": 5,
                "total_tokens": 15,
                "tool_input_tokens": 1,
                "tool_output_tokens": 2,
                "context_tokens": 100,
            }
        },
    )
    await ConversationDB.append_message(
        conversation_id,
        "assistant",
        "a2",
        {"usage": {"input_tokens": 20, "output_tokens": 7, "total_tokens": 27, "estimated": True}},
    )
    await ConversationDB.append_message(conversation_id, "assistant", "a3 without usage")
    await PostgresDB.execute("UPDATE conversations SET total_tokens = 42 WHERE id = %s", (conversation_id,))
    await ConversationDB.set_compaction_state(conversation_id, "s", 0)

    assert await ConversationDB.get_conversation_token_usage(conversation_id) == {
        "total_input": 31,
        "total_output": 14,
        "total": 42,
        "db_total": 42,
        "has_estimates": True,
        "partial_data": True,
        "had_summarization": True,
        "total_context_tokens": 100,
        "last_input_tokens": 20,
    }


async def test_token_usage_of_missing_conversation_is_zero(db):
    usage = await ConversationDB.get_conversation_token_usage("missing")
    assert usage["total"] == 0
    assert usage["db_total"] == 0
    assert usage["partial_data"] is False
    assert list(usage) == [
        "total_input",
        "total_output",
        "total",
        "db_total",
        "has_estimates",
        "partial_data",
        "had_summarization",
        "total_context_tokens",
        "last_input_tokens",
    ]
