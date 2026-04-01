"""Tests for BotMessageHandler."""

import asyncio
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any
from unittest.mock import AsyncMock, MagicMock

import pytest

from src.apps.bot.message_handler import ActiveTaskInfo, BotMessageHandler, ChatKey
from src.apps.bot.streaming import DeliveryResult, StreamingResponseManager


@dataclass
class MockIncomingMessage:
    chat_id: str
    text: str
    sender_id: str | None = None
    sender_name: str | None = None
    timestamp: float | None = None
    provider_name: str | None = None
    message_id: str | None = None
    raw: dict[str, Any] = field(default_factory=dict)


def _make_msg(chat_id, text, sender_id="user_1", sender_name="User", provider="telegram", message_id="msg_1"):
    return MockIncomingMessage(
        chat_id=chat_id,
        text=text,
        sender_id=sender_id,
        sender_name=sender_name,
        timestamp=datetime.now(UTC).timestamp(),
        provider_name=provider,
        message_id=message_id,
    )


@pytest.fixture
def mock_config():
    config = MagicMock()
    config.error_message = "Sorry, I encountered an error."
    config.busy_message = "I'm still thinking about your previous message."
    return config


@pytest.fixture
def mock_ai_client():
    client = MagicMock()
    client.achat_stream = AsyncMock()
    return client


@pytest.fixture
def mock_messaging_client():
    client = MagicMock()
    client.send_message = AsyncMock(return_value=MagicMock(success=True, message_id="sent_msg_123"))
    client.supports_message_edit = MagicMock(return_value=True)
    return client


@pytest.fixture
def mock_user_identity():
    manager = MagicMock()
    manager.resolve = MagicMock(return_value=MagicMock(user_id="user_abc", is_new=False, conversation_id=None))
    manager.set_conversation_id = MagicMock()
    return manager


@pytest.fixture
def mock_streaming():
    manager = MagicMock(spec=StreamingResponseManager)
    manager.deliver = AsyncMock(
        return_value=DeliveryResult(
            response_text="Hello! How can I help?",
            conversation_id="conv_123",
            usage={"total_tokens": 10},
            message_ids=["msg_1"],
            was_streaming=True,
        )
    )
    return manager


@pytest.fixture
def handler(mock_ai_client, mock_messaging_client, mock_user_identity, mock_streaming, mock_config):
    return BotMessageHandler(
        ai_client=mock_ai_client,
        messaging_client=mock_messaging_client,
        user_identity=mock_user_identity,
        streaming_manager=mock_streaming,
        config=mock_config,
    )


@pytest.fixture
def incoming_message():
    return _make_msg("chat_456", "Hello, bot!", sender_id="user_789", message_id="msg_123")


class TestChatKey:
    def test_hash_and_equality(self):
        key1 = ChatKey("telegram", "123")
        key2 = ChatKey("telegram", "123")
        key3 = ChatKey("telegram", "456")
        key4 = ChatKey("discord", "123")

        assert key1 == key2
        assert key1 != key3
        assert key1 != key4
        assert hash(key1) == hash(key2)
        assert hash(key1) != hash(key3)

        d = {key1: "value"}
        assert d[key2] == "value"
        assert key3 not in d

    def test_str(self):
        assert str(ChatKey("telegram", "123")) == "telegram:123"


@pytest.mark.asyncio
class TestActiveTaskInfo:
    async def test_creation(self):
        async def dummy():
            await asyncio.sleep(0.1)

        task = asyncio.create_task(dummy())
        info = ActiveTaskInfo(task=task, message_id="msg_test", user_hint="Test message")
        assert info.task is task
        assert info.message_id == "msg_test"
        assert info.user_hint == "Test message"
        assert isinstance(info.started_at, datetime)
        task.cancel()


@pytest.mark.asyncio
class TestBotMessageHandler:
    async def test_handle_returns_immediately(self, handler, incoming_message):
        handler._user_identity.resolve = MagicMock(return_value=MagicMock(user_id="user_1"))

        async def delay(**kw):
            await asyncio.sleep(0.5)

        handler._streaming.deliver = AsyncMock(side_effect=delay)

        loop = asyncio.get_event_loop()
        start = loop.time()
        await handler.handle(incoming_message)
        elapsed = loop.time() - start

        assert elapsed < 0.1
        assert handler.get_active_count() == 1

    async def test_busy_hint_for_concurrent_messages(self, handler, incoming_message):
        handler._user_identity.resolve = MagicMock(return_value=MagicMock(user_id="user_1"))

        async def delay(**kw):
            await asyncio.sleep(1)

        handler._streaming.deliver = AsyncMock(side_effect=delay)

        await handler.handle(incoming_message)
        assert handler.get_active_count() == 1

        await handler.handle(incoming_message)
        await asyncio.sleep(0.1)

        assert handler._messaging_client.send_message.called
        call_args = handler._messaging_client.send_message.call_args
        assert call_args.kwargs["text"] == handler._config.busy_message

    async def test_different_chats_process_concurrently(self, handler):
        handler._user_identity.resolve = MagicMock(return_value=MagicMock(user_id="user_1"))

        processed = []

        async def track_delivery(**kw):
            processed.append(kw["chat_id"])
            await asyncio.sleep(0.1)

        handler._streaming.deliver = track_delivery

        await handler.handle(_make_msg("chat_1", "Hello"))
        await handler.handle(_make_msg("chat_2", "Hi"))
        await asyncio.sleep(0.3)

        assert len(processed) == 2
        assert "chat_1" in processed
        assert "chat_2" in processed

    async def test_error_sends_user_message(self, handler, incoming_message):
        handler._user_identity.resolve = MagicMock(side_effect=Exception("Boom!"))

        await handler.handle(incoming_message)
        await asyncio.sleep(0.1)

        assert handler._messaging_client.send_message.called
        call_args = handler._messaging_client.send_message.call_args
        assert call_args.kwargs["text"] == handler._config.error_message

    async def test_cancel_all_cancels_active_tasks(self, handler, incoming_message):
        handler._user_identity.resolve = MagicMock(return_value=MagicMock(user_id="user_1"))
        handler._streaming.deliver = AsyncMock(side_effect=lambda **kw: asyncio.sleep(10))

        await handler.handle(incoming_message)
        assert handler.get_active_count() == 1

        await handler.cancel_all(timeout=1.0)
        assert handler.get_active_count() == 0

    async def test_cancel_all_no_active_tasks(self, handler):
        await handler.cancel_all(timeout=1.0)
        assert handler.get_active_count() == 0

    async def test_get_metrics(self, handler, incoming_message):
        handler._user_identity.resolve = MagicMock(return_value=MagicMock(user_id="user_1"))
        handler._streaming.deliver = AsyncMock(
            return_value=DeliveryResult(
                response_text="Hello!",
                conversation_id="conv_123",
                usage={"total_tokens": 10},
            )
        )

        await handler.handle(incoming_message)
        await asyncio.sleep(0.1)

        metrics = handler.get_metrics()
        assert metrics["total_processed"] == 1
        assert metrics["total_errors"] == 0
        assert metrics["total_queued"] == 0
        assert metrics["active_count"] == 0

    async def test_conversation_id_cached_after_delivery(self, handler, incoming_message):
        identity = MagicMock(user_id="user_abc", conversation_id=None)
        handler._user_identity.resolve = MagicMock(return_value=identity)
        handler._streaming.deliver = AsyncMock(
            return_value=DeliveryResult(
                response_text="Hello!",
                conversation_id="conv_new_456",
                usage={"total_tokens": 10},
            )
        )

        await handler.handle(incoming_message)
        await asyncio.sleep(0.1)

        handler._user_identity.set_conversation_id.assert_called_once_with("user_abc", "conv_new_456")

    async def test_conversation_id_not_updated_when_same(self, handler, incoming_message):
        identity = MagicMock(user_id="user_abc", conversation_id="conv_123")
        handler._user_identity.resolve = MagicMock(return_value=identity)
        handler._streaming.deliver = AsyncMock(
            return_value=DeliveryResult(
                response_text="Hello!",
                conversation_id="conv_123",
                usage={"total_tokens": 10},
            )
        )

        await handler.handle(incoming_message)
        await asyncio.sleep(0.1)

        handler._user_identity.set_conversation_id.assert_not_called()

    async def test_delivery_error_sends_user_message(self, handler, incoming_message):
        identity = MagicMock(user_id="user_abc", conversation_id=None)
        handler._user_identity.resolve = MagicMock(return_value=identity)
        handler._streaming.deliver = AsyncMock(
            return_value=DeliveryResult(
                response_text="",
                conversation_id=None,
                error="API rate limit exceeded",
            )
        )

        await handler.handle(incoming_message)
        await asyncio.sleep(0.1)

        assert handler._messaging_client.send_message.called
        assert handler._total_errors == 1

    async def test_full_message_flow(self, handler):
        identity = MagicMock(user_id="user_abc", conversation_id=None, is_new=True)
        handler._user_identity.resolve = MagicMock(return_value=identity)
        handler._streaming.deliver = AsyncMock(
            return_value=DeliveryResult(
                response_text="Hello! How can I help?",
                conversation_id="conv_789",
                usage={"total_tokens": 25},
                message_ids=["msg_1", "msg_2"],
                was_streaming=True,
                edit_count=3,
            )
        )

        incoming = _make_msg("chat_456", "What is AI?", sender_id="user_789", message_id="msg_123")

        await handler.handle(incoming)
        await asyncio.sleep(0.1)

        handler._user_identity.resolve.assert_called_once()
        resolve_args = handler._user_identity.resolve.call_args
        assert resolve_args[0][0] is incoming
        assert resolve_args[0][1] == "telegram"

        handler._streaming.deliver.assert_called_once()
        deliver_kwargs = handler._streaming.deliver.call_args.kwargs
        assert deliver_kwargs["provider"] == "telegram"
        assert deliver_kwargs["chat_id"] == "chat_456"
        assert deliver_kwargs["prompt"] == "What is AI?"
        assert deliver_kwargs["conversation_id"] is None

        handler._user_identity.set_conversation_id.assert_called_once_with("user_abc", "conv_789")

        metrics = handler.get_metrics()
        assert metrics["total_processed"] == 1
        assert metrics["active_count"] == 0

    async def test_queued_count_increments(self, handler, incoming_message):
        handler._user_identity.resolve = MagicMock(return_value=MagicMock(user_id="user_1"))

        async def delay(**kw):
            await asyncio.sleep(1)

        handler._streaming.deliver = AsyncMock(side_effect=delay)

        await handler.handle(incoming_message)
        await handler.handle(incoming_message)
        await handler.handle(incoming_message)

        metrics = handler.get_metrics()
        assert metrics["total_queued"] == 2

    async def test_handle_message_without_provider(self, handler):
        handler._user_identity.resolve = MagicMock(return_value=MagicMock(user_id="user_1"))

        incoming = _make_msg("chat_1", "Hello", provider=None)

        await handler.handle(incoming)
        assert handler.get_active_count() == 1
