"""Tests for Telegram provider."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from src.lib.services.messaging_client.providers.telegram_provider import (
    TelegramProvider,
    _split_text,
)


class TestSplitText:
    def test_short_text_unchanged(self):
        assert _split_text("Hello") == ["Hello"]

    def test_exact_max_len_unchanged(self):
        text = "x" * 4096
        assert _split_text(text) == [text]

    def test_splits_at_newline(self):
        text = "line1\n" + "x" * 4100
        chunks = _split_text(text)
        assert len(chunks) >= 2
        assert chunks[0] == "line1"

    def test_splits_hard_when_no_newline(self):
        text = "x" * 5000
        chunks = _split_text(text)
        assert len(chunks) == 2
        assert len(chunks[0]) == 4096


class TestTelegramProviderEditMessage:
    @pytest.fixture
    def provider(self):
        with patch.object(TelegramProvider, "__init__", lambda self, **kwargs: None):
            provider = TelegramProvider.__new__(TelegramProvider)
            provider._token = "test_token"
            provider._bot = MagicMock()
            provider._app = None
            yield provider

    def test_supports_message_edit(self, provider):
        assert provider.supports_message_edit() is True

    @pytest.mark.asyncio
    async def test_edit_message_success(self, provider):
        mock_msg = MagicMock()
        mock_msg.message_id = 123
        provider._bot.edit_message_text = AsyncMock(return_value=mock_msg)
        provider._bot.send_message = AsyncMock()

        result = await provider.edit_message("456", "789", "New text")

        assert result.success is True
        assert result.message_id == "123"
        provider._bot.edit_message_text.assert_called_once_with(
            chat_id=456,
            message_id=789,
            text="New text",
        )

    @pytest.mark.asyncio
    async def test_edit_message_with_chunks(self, provider):
        mock_msg = MagicMock()
        mock_msg.message_id = 123
        provider._bot.edit_message_text = AsyncMock(return_value=mock_msg)
        provider._bot.send_message = AsyncMock()

        long_text = "x" * 5000
        result = await provider.edit_message("456", "789", long_text)

        assert result.success is True
        provider._bot.edit_message_text.assert_called_once()
        provider._bot.send_message.assert_called_once()

    @pytest.mark.asyncio
    async def test_edit_message_not_modified_returns_success(self, provider):
        provider._bot.edit_message_text = AsyncMock(side_effect=Exception("message is not modified"))

        result = await provider.edit_message("456", "789", "Same text")

        assert result.success is True
        assert result.message_id == "789"

    @pytest.mark.asyncio
    async def test_edit_message_not_configured(self):
        with patch.object(TelegramProvider, "__init__", lambda self, **kwargs: None):
            provider = TelegramProvider.__new__(TelegramProvider)
            provider._token = None
            provider._bot = None
            provider._app = None

            result = await provider.edit_message("456", "789", "text")
            assert result.success is False
            assert "not configured" in result.error.lower()


class TestTelegramProviderProviderName:
    @pytest.fixture
    def provider(self):
        with patch.object(TelegramProvider, "__init__", lambda self, **kwargs: None):
            provider = TelegramProvider.__new__(TelegramProvider)
            provider._on_message = None
            yield provider

    @pytest.mark.asyncio
    async def test_handle_message_sets_provider_name(self, provider):
        mock_update = MagicMock()
        mock_update.message.chat_id = 123
        mock_update.message.text = "Hello"
        mock_update.message.from_user.id = 456
        mock_update.message.from_user.full_name = "Test User"
        mock_update.message.date.timestamp.return_value = 1234567890.0
        mock_update.to_dict.return_value = {}

        received_message = None

        async def capture_message(msg):
            nonlocal received_message
            received_message = msg

        provider._on_message = capture_message

        await provider._handle_message(mock_update, None)

        assert received_message is not None
        assert received_message.provider_name == "telegram"
        assert received_message.chat_id == "123"
        assert received_message.text == "Hello"
