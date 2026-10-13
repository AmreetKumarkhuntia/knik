"""Tests for UserIdentityManager."""

import time

import pytest

from bot.user_identity import UserIdentityManager
from lib.services.telegram.models import IncomingMessage


class TestUserIdentityManager:
    @pytest.fixture
    def manager(self) -> UserIdentityManager:
        return UserIdentityManager()

    @pytest.fixture
    def message(self) -> IncomingMessage:
        return IncomingMessage(
            chat_id="tg_chat_123",
            text="Hello",
            sender_id="tg_user_456",
            sender_name="Telegram User",
            timestamp=time.time(),
        )

    def test_resolve_new_identity(self, manager, message):
        identity = manager.resolve(message)

        assert identity.is_new is True
        assert identity.user_id.startswith("usr_")
        assert identity.sender_id == "tg_user_456"
        assert identity.conversation_id is None

    def test_resolve_existing_identity(self, manager, message):
        identity1 = manager.resolve(message)
        identity2 = manager.resolve(message)

        assert identity1.is_new is True
        assert identity2.is_new is False
        assert identity1.user_id == identity2.user_id

    def test_different_senders_different_users(self, manager, message):
        other = IncomingMessage(chat_id="tg_chat_123", text="Hi", sender_id="tg_user_789")

        assert manager.resolve(message).user_id != manager.resolve(other).user_id

    def test_resolve_without_sender_id_raises(self, manager):
        msg = IncomingMessage(chat_id="123", text="hi", sender_id=None)

        with pytest.raises(ValueError, match="no sender_id"):
            manager.resolve(msg)

    def test_conversation_id_management(self, manager, message):
        identity = manager.resolve(message)

        assert manager.get_conversation_id(identity.user_id) is None

        manager.set_conversation_id(identity.user_id, "conv_abc123")
        assert manager.get_conversation_id(identity.user_id) == "conv_abc123"

        manager.clear_conversation_id(identity.user_id)
        assert manager.get_conversation_id(identity.user_id) is None

    def test_conversation_reflected_in_resolve(self, manager, message):
        identity1 = manager.resolve(message)
        manager.set_conversation_id(identity1.user_id, "conv_xyz")

        identity2 = manager.resolve(message)
        assert identity2.conversation_id == "conv_xyz"

    def test_lookup_by_sender(self, manager, message):
        assert manager.get_user_id_for_sender("tg_user_456") is None
        assert manager.get_user_id_for_sender(None) is None

        identity = manager.resolve(message)
        manager.set_conversation_id(identity.user_id, "conv_1")

        assert manager.get_user_id_for_sender("tg_user_456") == identity.user_id
        assert manager.get_conversation_id_for_sender("tg_user_456") == "conv_1"
        assert manager.get_conversation_id_for_sender("unknown") is None

    def test_user_metadata(self, manager, message):
        identity = manager.resolve(message)
        metadata = manager.get_user_metadata(identity.user_id)

        assert metadata == {"first_seen_at": message.timestamp, "sender_name": "Telegram User"}
