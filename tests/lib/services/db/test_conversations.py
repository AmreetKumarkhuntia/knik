"""ConversationDB against a real database."""

import asyncio
from datetime import UTC, datetime

import psycopg
import pytest

from lib.services.db import ConversationDB, ConversationScope, PostgresDB, UserDB
from tests.db_support import MIGRATIONS_DIR, requires_db


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

    listed = await ConversationDB.list_conversations(ConversationScope.local())
    assert [c.id for c in listed] == [first, second]
    assert listed[0].messages == []
    assert listed[0].message_count == 2
    assert listed[0].preview == "x" * 200
    assert listed[1].message_count == 0
    assert listed[1].preview is None

    assert [c.id for c in await ConversationDB.list_conversations(ConversationScope.local(), limit=1, offset=1)] == [
        second
    ]
    assert await ConversationDB.get_conversation("missing") is None


async def test_a_conversation_records_its_owner_and_source(db):
    user = await UserDB.get_or_create("telegram", "42")
    owned = await ConversationDB.create_conversation("Mine", user_id=user.id, source="telegram")
    web = await ConversationDB.create_conversation(source="web")
    legacy = await ConversationDB.create_conversation()

    found = {cid: await ConversationDB.get_conversation(cid) for cid in (owned, web, legacy)}
    assert {cid: (c.user_id, c.source) for cid, c in found.items()} == {
        owned: (user.id, "telegram"),
        web: (None, "web"),
        legacy: (None, None),
    }
    listed = await ConversationDB.list_conversations(ConversationScope.owned_by(user.id))
    assert [(c.id, c.user_id, c.source) for c in listed] == [(owned, user.id, "telegram")]


async def _one_of_each() -> dict[str, str]:
    alice = (await UserDB.get_or_create("telegram", "alice")).id
    bob = (await UserDB.get_or_create("telegram", "bob")).id
    return {
        "alice_id": alice,
        "bob_id": bob,
        "alice": await ConversationDB.create_conversation(user_id=alice, source="telegram"),
        "bob": await ConversationDB.create_conversation(user_id=bob, source="telegram"),
        "web": await ConversationDB.create_conversation(source="web"),
        "legacy": await ConversationDB.create_conversation(),
    }


async def _visible(scope: ConversationScope, made: dict[str, str]) -> tuple[set[str], set[str]]:
    """The kinds of conversation `scope` lists, and those it opens by id."""
    names = {cid: name for name, cid in made.items() if not name.endswith("_id")}
    listed = {names[c.id] for c in await ConversationDB.list_conversations(scope)}
    opened = {name for cid, name in names.items() if await ConversationDB.get_conversation(cid, scope) is not None}
    return listed, opened


async def test_a_bot_user_sees_only_their_own_conversations(db):
    made = await _one_of_each()

    assert await _visible(ConversationScope.owned_by(made["alice_id"]), made) == ({"alice"}, {"alice"})
    assert await _visible(ConversationScope.owned_by(made["bob_id"]), made) == ({"bob"}, {"bob"})
    assert await _visible(ConversationScope.owned_by("usr_unknown"), made) == (set(), set())


async def test_the_local_scope_sees_web_and_legacy_conversations_and_no_bot_users(db):
    made = await _one_of_each()

    assert await _visible(ConversationScope.local(), made) == ({"web", "legacy"}, {"web", "legacy"})


async def test_an_empty_scope_sees_nothing_and_no_scope_opens_anything(db):
    made = await _one_of_each()

    assert await _visible(ConversationScope(), made) == (set(), set())
    assert all([await ConversationDB.get_conversation(made[name]) for name in ("alice", "bob", "web", "legacy")])


async def test_a_deleted_users_conversations_lose_their_owner_and_stay_out_of_the_local_scope(db):
    made = await _one_of_each()

    await PostgresDB.execute("DELETE FROM users WHERE id = %s", (made["alice_id"],))

    orphan = await ConversationDB.get_conversation(made["alice"])
    assert (orphan.user_id, orphan.source) == (None, "telegram")
    assert await _visible(ConversationScope.local(), made) == ({"web", "legacy"}, {"web", "legacy"})


async def test_the_owner_migration_can_run_again_and_keeps_owners_and_legacy_rows(db):
    made = await _one_of_each()
    migration = (MIGRATIONS_DIR / "014_add_users_and_conversation_owners.sql").read_bytes()

    for _ in range(2):
        async with PostgresDB.get_connection() as conn:
            await conn.execute(migration)

    owners = {name: await ConversationDB.get_conversation(made[name]) for name in ("alice", "web", "legacy")}
    assert {name: (c.user_id, c.source) for name, c in owners.items()} == {
        "alice": (made["alice_id"], "telegram"),
        "web": (None, "web"),
        "legacy": (None, None),
    }
    assert (await UserDB.get(made["alice_id"])).external_id == "alice"
    indexes = await PostgresDB.fetch_all("SELECT indexname FROM pg_indexes WHERE tablename = 'conversations'")
    assert {"idx_conversations_user_id_updated_at", "idx_conversations_source_updated_at"} <= {
        row["indexname"] for row in indexes
    }


async def test_a_conversation_needs_a_known_source_and_owner(db):
    with pytest.raises(psycopg.errors.CheckViolation):
        await ConversationDB.create_conversation(source="carrier pigeon")
    with pytest.raises(psycopg.errors.ForeignKeyViolation):
        await ConversationDB.create_conversation(user_id="usr_unknown", source="telegram")


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


async def test_appended_messages_add_their_tokens_to_the_total(db):
    conversation_id = await ConversationDB.create_conversation()
    await ConversationDB.append_message(conversation_id, "user", "q")

    # Concurrent turns each add their own share: the increment happens in the UPDATE, not in Python.
    await asyncio.gather(
        *(ConversationDB.append_message(conversation_id, "assistant", "a", tokens=5) for _ in range(8))
    )

    conversation = await ConversationDB.get_conversation(conversation_id)
    assert (conversation.total_tokens, conversation.message_count) == (40, 9)


async def test_the_backfill_migration_rebuilds_totals_from_saved_usage(db):
    unwritten = await ConversationDB.create_conversation()
    await ConversationDB.append_message(unwritten, "user", "q")
    for tokens in (30, 12):
        await ConversationDB.append_message(unwritten, "assistant", "a", metadata={"usage": {"total_tokens": tokens}})
    await ConversationDB.append_message(unwritten, "assistant", "no usage saved")
    counted = await ConversationDB.create_conversation()
    await ConversationDB.append_message(counted, "assistant", "a", metadata={"usage": {"total_tokens": 10}}, tokens=99)
    migration = (MIGRATIONS_DIR / "013_backfill_conversation_total_tokens.sql").read_bytes()

    for _ in range(2):
        async with PostgresDB.get_connection() as conn:
            await conn.execute(migration)

        totals = {cid: (await ConversationDB.get_conversation(cid)).total_tokens for cid in (unwritten, counted)}
        # A total is only ever raised, so one that code already wrote is kept.
        assert totals == {unwritten: 42, counted: 99}


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
