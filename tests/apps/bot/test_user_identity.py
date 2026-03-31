"""Tests for UserIdentityManager."""

import time

import pytest

from src.apps.bot.user_identity import UserIdentityManager
from src.lib.services.messaging_client.models import IncomingMessage


class TestUserIdentityManager:
    """Tests for UserIdentityManager."""

    @pytest.fixture
    def manager(self) -> UserIdentityManager:
        return UserIdentityManager()

    @pytest.fixture
    def telegram_message(self) -> IncomingMessage:
        return IncomingMessage(
            chat_id="tg_chat_123",
            text="Hello",
            sender_id="tg_user_456",
            sender_name="Telegram User",
            timestamp=time.time(),
        )

    @pytest.fixture
    def whatsapp_message(self) -> IncomingMessage:
        return IncomingMessage(
            chat_id="wa_chat_789",
            text="Hi",
            sender_id="wa_user_012",
            sender_name="WhatsApp User",
            timestamp=time.time(),
        )

    def test_resolve_new_identity(self, manager, telegram_message):
        """Test resolving a new user identity."""
        identity = manager.resolve(telegram_message, "telegram")

        assert identity.is_new is True
        assert identity.user_id.startswith("usr_")
        assert identity.provider == "telegram"
        assert identity.sender_id == "tg_user_456"
        assert identity.conversation_id is None

    def test_resolve_existing_identity(self, manager, telegram_message):
        """Test resolving an existing identity returns same user_id."""
        identity1 = manager.resolve(telegram_message, "telegram")
        identity2 = manager.resolve(telegram_message, "telegram")

        assert identity1.is_new is True
        assert identity2.is_new is False
        assert identity1.user_id == identity2.user_id

    def test_resolve_without_sender_id_raises(self, manager):
        """Test that missing sender_id raises ValueError."""
        msg = IncomingMessage(chat_id="123", text="hi", sender_id=None)

        with pytest.raises(ValueError, match="no sender_id"):
            manager.resolve(msg, "telegram")

    def test_provider_case_insensitive(self, manager, telegram_message):
        """Test provider names are normalized to lowercase."""
        identity1 = manager.resolve(telegram_message, "Telegram")
        identity2 = manager.resolve(telegram_message, "TELEGRAM")

        assert identity1.user_id == identity2.user_id

    def test_different_providers_different_users(self, manager, telegram_message, whatsapp_message):
        """Test different providers create different users by default."""
        whatsapp_message.sender_id = telegram_message.sender_id

        id_telegram = manager.resolve(telegram_message, "telegram")
        id_whatsapp = manager.resolve(whatsapp_message, "whatsapp")

        assert id_telegram.user_id != id_whatsapp.user_id

    def test_conversation_id_management(self, manager, telegram_message):
        """Test conversation ID get/set operations."""
        identity = manager.resolve(telegram_message, "telegram")

        assert manager.get_conversation_id(identity.user_id) is None

        manager.set_conversation_id(identity.user_id, "conv_abc123")
        assert manager.get_conversation_id(identity.user_id) == "conv_abc123"

        manager.clear_conversation_id(identity.user_id)
        assert manager.get_conversation_id(identity.user_id) is None

    def test_conversation_reflected_in_resolve(self, manager, telegram_message):
        """Test that resolve returns current conversation_id."""
        identity1 = manager.resolve(telegram_message, "telegram")
        manager.set_conversation_id(identity1.user_id, "conv_xyz")

        identity2 = manager.resolve(telegram_message, "telegram")
        assert identity2.conversation_id == "conv_xyz"

    def test_get_stats(self, manager, telegram_message, whatsapp_message):
        """Test statistics reporting."""
        manager.resolve(telegram_message, "telegram")
        manager.resolve(whatsapp_message, "whatsapp")

        user_id = manager.resolve(telegram_message, "telegram").user_id
        manager.set_conversation_id(user_id, "conv_1")

        stats = manager.get_stats()

        assert stats["total_identities"] == 2
        assert stats["active_conversations"] == 1
        assert stats["providers"] == {"telegram": 1, "whatsapp": 1}

    def test_link_identities(self, manager, telegram_message, whatsapp_message):
        """Test manual identity linking."""
        tg_identity = manager.resolve(telegram_message, "telegram")

        manager.link_identities(tg_identity.user_id, "whatsapp", whatsapp_message.sender_id)

        wa_identity = manager.resolve(whatsapp_message, "whatsapp")
        assert wa_identity.user_id == tg_identity.user_id
        assert wa_identity.is_new is False

    def test_link_identities_nonexistent_user_raises(self, manager, whatsapp_message):
        """Test linking to nonexistent user raises."""
        with pytest.raises(ValueError, match="does not exist"):
            manager.link_identities("usr_nonexistent", "whatsapp", "123")

    def test_link_identities_already_linked_raises(self, manager, telegram_message, whatsapp_message):
        """Test linking already-linked identity raises."""
        tg_identity = manager.resolve(telegram_message, "telegram")
        wa_identity = manager.resolve(whatsapp_message, "whatsapp")

        with pytest.raises(ValueError, match="already linked"):
            manager.link_identities(tg_identity.user_id, "whatsapp", wa_identity.sender_id)

    def test_user_metadata(self, manager, telegram_message):
        """Test user metadata storage."""
        identity = manager.resolve(telegram_message, "telegram")
        metadata = manager.get_user_metadata(identity.user_id)

        assert metadata["first_seen_provider"] == "telegram"
        assert metadata["sender_name"] == "Telegram User"
        assert metadata["first_seen_at"] == telegram_message.timestamp
