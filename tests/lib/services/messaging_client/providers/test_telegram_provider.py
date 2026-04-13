"""Tests for Telegram provider."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from src.lib.services.messaging_client.providers.base_provider import BaseMessagingProvider
from src.lib.services.messaging_client.providers.telegram_provider import TelegramProvider


class TestChunkText:
    @pytest.fixture
    def provider(self):
        with patch.object(TelegramProvider, "__init__", lambda self, **kwargs: None):
            p = TelegramProvider.__new__(TelegramProvider)
            p._token = "test_token"
            p._bot = MagicMock()
            p._app = None
            yield p

    def test_short_text_unchanged(self, provider):
        assert provider.chunk_text("Hello") == ["Hello"]

    def test_exact_max_len_unchanged(self, provider):
        text = "x" * 4096
        assert provider.chunk_text(text) == [text]

    def test_splits_long_text(self, provider):
        text = "x" * 5000
        chunks = provider.chunk_text(text)
        assert len(chunks) >= 2
        assert all(len(c) <= 4096 for c in chunks)

    def test_splits_at_newline(self, provider):
        text = "line1\n" + "x" * 4100
        chunks = provider.chunk_text(text)
        assert len(chunks) >= 2
        assert chunks[0].startswith("line1")


class TestBaseProviderChunking:
    @pytest.fixture
    def provider(self):
        with patch.object(TelegramProvider, "__init__", lambda self, **kwargs: None):
            p = TelegramProvider.__new__(TelegramProvider)
            p._token = "test_token"
            p._bot = MagicMock()
            p._app = None
            yield p

    def test_chunk_text_returns_single_chunk_for_short_text(self, provider):
        text = "Hello world"
        chunks = provider.chunk_text(text)
        assert len(chunks) == 1
        assert chunks[0] == text

    def test_chunk_text_splits_long_text(self, provider):
        provider.max_message_length = 100
        text = "A" * 250
        chunks = provider.chunk_text(text)
        assert len(chunks) == 3
        assert all(len(c) <= 100 for c in chunks)
        assert "".join(chunks) == text

    def test_chunk_text_splits_at_newline(self, provider):
        provider.max_message_length = 50
        text = "First paragraph here.\n\nSecond paragraph here.\n\nThird one."
        chunks = provider.chunk_text(text)
        assert len(chunks) > 1

    def test_find_split_point_returns_newline_position(self, provider):
        text = "First line\nSecond line\nThird line"
        pos = BaseMessagingProvider._find_split_point(text, 25)
        assert text[pos - 1] == "\n" or text[pos] == "\n"

    def test_find_split_point_falls_back_to_hard_split(self, provider):
        text = "A" * 300
        pos = BaseMessagingProvider._find_split_point(text, 100)
        assert pos == 100


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


class TestTelegramProviderSendStream:
    @pytest.fixture
    def provider(self):
        with patch.object(TelegramProvider, "__init__", lambda self, **kwargs: None):
            p = TelegramProvider.__new__(TelegramProvider)
            p._token = "test_token"
            p._bot = MagicMock()
            p._app = None
            yield p

    @pytest.mark.asyncio
    async def test_send_stream_sends_first_chunk_then_edits(self, provider):
        mock_msg = MagicMock()
        mock_msg.message_id = 42
        provider._bot.send_message = AsyncMock(return_value=mock_msg)
        provider._bot.edit_message_text = AsyncMock(return_value=mock_msg)

        async def chunks():
            yield "Hello"
            yield " world"
            yield "!"

        result = await provider.send_stream("123", chunks())

        assert result.success is True
        assert result.message_id == "42"
        provider._bot.send_message.assert_called_once()
        provider._bot.edit_message_text.assert_called()

    @pytest.mark.asyncio
    async def test_send_stream_empty_stream(self, provider):
        async def empty():
            return
            yield

        result = await provider.send_stream("123", empty())

        assert result.success is True
        provider._bot.send_message.assert_not_called()
        provider._bot.edit_message_text.assert_not_called()

    @pytest.mark.asyncio
    async def test_send_stream_not_configured(self):
        with patch.object(TelegramProvider, "__init__", lambda self, **kwargs: None):
            p = TelegramProvider.__new__(TelegramProvider)
            p._token = None
            p._bot = None
            p._app = None

            async def chunks():
                yield "hi"

            result = await p.send_stream("123", chunks())
            assert result.success is False

    @pytest.mark.asyncio
    async def test_send_stream_edit_not_modified_ignored(self, provider):
        mock_msg = MagicMock()
        mock_msg.message_id = 42
        provider._bot.send_message = AsyncMock(return_value=mock_msg)
        provider._bot.edit_message_text = AsyncMock(side_effect=Exception("message is not modified"))

        async def chunks():
            yield "text"

        result = await provider.send_stream("123", chunks())

        assert result.success is True
        assert result.message_id == "42"

    @pytest.mark.asyncio
    async def test_send_stream_chunks_long_final_text(self, provider):
        provider.max_message_length = 10
        mock_msg1 = MagicMock()
        mock_msg1.message_id = 1
        mock_msg2 = MagicMock()
        mock_msg2.message_id = 2
        provider._bot.send_message = AsyncMock(side_effect=[mock_msg1, mock_msg2])
        provider._bot.edit_message_text = AsyncMock(return_value=mock_msg1)

        async def chunks():
            yield "A" * 15

        result = await provider.send_stream("123", chunks())

        assert result.success is True
        assert provider._bot.send_message.call_count == 2

    @pytest.mark.asyncio
    async def test_send_stream_single_chunk_no_edit(self, provider):
        mock_msg = MagicMock()
        mock_msg.message_id = 7
        provider._bot.send_message = AsyncMock(return_value=mock_msg)
        provider._bot.edit_message_text = AsyncMock(return_value=mock_msg)

        async def chunks():
            yield "single"

        result = await provider.send_stream("123", chunks())

        assert result.success is True
        assert result.message_id == "7"
        provider._bot.send_message.assert_called_once()
        provider._bot.edit_message_text.assert_called_once()


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
