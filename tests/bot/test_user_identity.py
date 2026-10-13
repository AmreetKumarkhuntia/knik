"""Tests for UserIdentityManager: a sender's id comes from Postgres, so it survives a restart."""

import asyncio
import time
from unittest.mock import patch

import pytest

from bot.user_identity import UserIdentityManager
from lib.services.db import ConversationScope, UserDB
from lib.services.telegram.models import IncomingMessage
from tests.db_support import requires_db


def _message(sender_id: str | None = "tg_user_456", name: str | None = "Telegram User") -> IncomingMessage:
    return IncomingMessage(
        chat_id="tg_chat_123", text="Hello", sender_id=sender_id, sender_name=name, timestamp=time.time()
    )


@pytest.mark.asyncio
class TestUserIdentityManager:
    @pytest.fixture
    def manager(self) -> UserIdentityManager:
        return UserIdentityManager()

    @pytest.fixture
    def message(self) -> IncomingMessage:
        return _message()

    async def test_resolve_new_identity(self, manager, message, users):
        identity = await manager.resolve(message)

        assert identity.is_new is True
        assert identity.user_id == users.rows[("telegram", "tg_user_456")].id
        assert identity.user_id.startswith("usr_")
        assert identity.sender_id == "tg_user_456"
        assert identity.conversation_id is None
        assert users.rows[("telegram", "tg_user_456")].display_name == "Telegram User"

    async def test_resolve_existing_identity_uses_the_cache(self, manager, message, users):
        identity1 = await manager.resolve(message)
        identity2 = await manager.resolve(message)

        assert identity1.is_new is True
        assert identity2.is_new is False
        assert identity1.user_id == identity2.user_id
        assert users.lookups == 1

    async def test_different_senders_different_users(self, manager, message):
        other = IncomingMessage(chat_id="tg_chat_123", text="Hi", sender_id="tg_user_789")

        assert (await manager.resolve(message)).user_id != (await manager.resolve(other)).user_id

    async def test_resolve_without_sender_id_raises(self, manager):
        with pytest.raises(ValueError, match="no sender_id"):
            await manager.resolve(_message(sender_id=None))

    async def test_conversation_id_management(self, manager, message):
        identity = await manager.resolve(message)

        assert manager.get_conversation_id(identity.user_id) is None

        manager.set_conversation_id(identity.user_id, "conv_abc123")
        assert manager.get_conversation_id(identity.user_id) == "conv_abc123"

        manager.clear_conversation_id(identity.user_id)
        assert manager.get_conversation_id(identity.user_id) is None

    async def test_conversation_reflected_in_resolve(self, manager, message):
        identity1 = await manager.resolve(message)
        manager.set_conversation_id(identity1.user_id, "conv_xyz")

        identity2 = await manager.resolve(message)
        assert identity2.conversation_id == "conv_xyz"

    async def test_lookup_by_sender(self, manager, message):
        assert manager.get_user_id_for_sender("tg_user_456") is None
        assert manager.get_user_id_for_sender(None) is None

        identity = await manager.resolve(message)
        manager.set_conversation_id(identity.user_id, "conv_1")

        assert manager.get_user_id_for_sender("tg_user_456") == identity.user_id
        assert manager.get_conversation_id_for_sender("tg_user_456") == "conv_1"
        assert manager.get_conversation_id_for_sender("unknown") is None

    async def test_user_metadata(self, manager, message):
        identity = await manager.resolve(message)
        metadata = manager.get_user_metadata(identity.user_id)

        assert metadata == {"first_seen_at": message.timestamp, "sender_name": "Telegram User"}

    async def test_a_user_sees_only_their_own_conversations(self, manager, message):
        identity = await manager.resolve(message)

        assert manager.conversation_scope(identity.user_id) == ConversationScope.owned_by(identity.user_id)


@pytest.mark.asyncio
async def test_a_sender_keeps_their_id_across_a_restart(users):
    before = await UserIdentityManager().resolve(_message())

    # A restarted bot: a new manager with nothing in memory, the same users rows.
    after = await UserIdentityManager().resolve(_message())

    assert after.user_id == before.user_id
    assert after.is_new is True


@pytest.mark.asyncio
async def test_concurrent_first_messages_get_one_id_from_one_lookup(users):
    manager = UserIdentityManager()

    first, second = await asyncio.gather(manager.resolve(_message()), manager.resolve(_message()))

    assert first.user_id == second.user_id
    assert users.lookups == 1


@pytest.mark.asyncio
async def test_without_postgres_a_sender_gets_a_temporary_id_and_one_warning(users):
    users.unavailable = True
    manager = UserIdentityManager()

    with patch("bot.user_identity.printer") as printer:
        first = await manager.resolve(_message())
        again = await manager.resolve(_message())
        other = await manager.resolve(_message(sender_id="tg_user_789"))

    assert first.user_id.startswith("usr_")
    assert again.user_id == first.user_id
    assert other.user_id != first.user_id
    assert (first.is_new, again.is_new) == (True, False)
    assert printer.warning.call_count == 1
    assert "database unavailable" in printer.warning.call_args.args[0]
    # Every message tries Postgres again.
    assert users.lookups == 3


@pytest.mark.asyncio
async def test_a_sender_moves_to_their_stored_id_once_postgres_is_back(users):
    stored = await UserIdentityManager().resolve(_message())
    users.unavailable = True
    manager = UserIdentityManager()
    stand_in = await manager.resolve(_message())

    users.unavailable = False
    back = await manager.resolve(_message())
    cached = await manager.resolve(_message())

    assert stand_in.user_id != stored.user_id
    assert back.user_id == cached.user_id == stored.user_id
    assert back.is_new is False
    assert manager.get_user_id_for_sender("tg_user_456") == stored.user_id
    assert manager.get_user_metadata(stored.user_id)["sender_name"] == "Telegram User"
    assert users.lookups == 3


@pytest.mark.asyncio
async def test_a_sender_first_seen_during_an_outage_gets_a_stored_id_after_it(users):
    users.unavailable = True
    manager = UserIdentityManager()
    stand_in = await manager.resolve(_message())

    users.unavailable = False
    back = await manager.resolve(_message())

    assert back.user_id == users.rows[("telegram", "tg_user_456")].id != stand_in.user_id
    assert manager.conversation_scope(back.user_id) == ConversationScope.owned_by(back.user_id)


@pytest.mark.asyncio
async def test_session_version_changes_on_every_set_and_clear():
    manager = UserIdentityManager()
    user_id = (await manager.resolve(IncomingMessage(chat_id="c", text="hi", sender_id="s"))).user_id
    before = manager.session_version(user_id)

    manager.clear_conversation_id(user_id)
    after_clear = manager.session_version(user_id)
    manager.set_conversation_id(user_id, "conv_1")

    # Clearing an already empty session still counts: a /new is a choice a finishing reply must not undo.
    assert before < after_clear < manager.session_version(user_id)
    assert manager.session_version("someone_else") == 0


@requires_db
@pytest.mark.asyncio
async def test_a_sender_keeps_their_id_across_a_restart_in_postgres(db, monkeypatch):
    monkeypatch.setattr("bot.user_identity.UserDB", UserDB)

    before = await UserIdentityManager().resolve(_message(name="Ada"))
    after = await UserIdentityManager().resolve(_message(name=None))
    other = await UserIdentityManager().resolve(_message(sender_id="tg_user_789"))

    assert after.user_id == before.user_id != other.user_id
    stored = await UserDB.get(before.user_id)
    assert (stored.source, stored.external_id, stored.display_name) == ("telegram", "tg_user_456", "Ada")
