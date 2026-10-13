"""Tests for BotMessageHandler."""

import asyncio
from concurrent.futures import Future
from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock

import pytest

from bot.consent import PendingConsents
from bot.message_handler import BotMessageHandler
from bot.streaming import DeliveryResult, StreamingResponseManager
from lib.commands.models import CommandResult
from lib.services.telegram.models import IncomingMessage


def _make_msg(chat_id, text, sender_id="user_1", sender_name="User", message_id="msg_1"):
    return IncomingMessage(
        chat_id=chat_id,
        text=text,
        sender_id=sender_id,
        sender_name=sender_name,
        timestamp=datetime.now(UTC).timestamp(),
        message_id=message_id,
    )


@pytest.fixture
def mock_config():
    config = MagicMock()
    config.error_message = "Sorry, I encountered an error."
    config.busy_message = "I'm still thinking about your previous message."
    return config


@pytest.fixture
def mock_command_service():
    service = MagicMock()
    service.ai_client = MagicMock()
    return service


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
        )
    )
    return manager


@pytest.fixture
def handler(mock_command_service, transport, mock_user_identity, mock_streaming, mock_config):
    return BotMessageHandler(
        command_service=mock_command_service,
        transport=transport,
        user_identity=mock_user_identity,
        streaming_manager=mock_streaming,
        config=mock_config,
    )


@pytest.fixture
def incoming_message():
    return _make_msg("chat_456", "Hello, bot!", sender_id="user_789", message_id="msg_123")


@pytest.mark.asyncio
class TestBotMessageHandler:
    async def test_handle_returns_immediately(self, handler, incoming_message):
        async def delay(**kw):
            await asyncio.sleep(0.5)

        handler._streaming.deliver = AsyncMock(side_effect=delay)

        loop = asyncio.get_running_loop()
        start = loop.time()
        await handler.handle(incoming_message)
        elapsed = loop.time() - start

        assert elapsed < 0.1
        assert handler.get_active_count() == 1
        await handler.cancel_all(timeout=1.0)

    async def test_busy_hint_for_concurrent_messages(self, handler, transport, incoming_message):
        async def delay(**kw):
            await asyncio.sleep(1)

        handler._streaming.deliver = AsyncMock(side_effect=delay)

        await handler.handle(incoming_message)
        assert handler.get_active_count() == 1

        await handler.handle(incoming_message)
        await asyncio.sleep(0.1)

        assert transport.messages[-1].text == handler._config.busy_message
        assert transport.messages[-1].kwargs == {"reply_to_message_id": "msg_123"}
        await handler.cancel_all(timeout=1.0)

    async def test_different_chats_process_concurrently(self, handler):
        processed = []

        async def track_delivery(**kw):
            processed.append(kw["chat_id"])
            await asyncio.sleep(0.1)

        handler._streaming.deliver = track_delivery

        await handler.handle(_make_msg("chat_1", "Hello"))
        await handler.handle(_make_msg("chat_2", "Hi"))
        await asyncio.sleep(0.3)

        assert sorted(processed) == ["chat_1", "chat_2"]

    async def test_error_sends_user_message(self, handler, transport, incoming_message):
        handler._user_identity.resolve = MagicMock(side_effect=Exception("Boom!"))

        await handler.handle(incoming_message)
        await asyncio.sleep(0.1)

        assert transport.messages[-1].text == handler._config.error_message

    async def test_cancel_all_cancels_active_tasks(self, handler, incoming_message):
        handler._streaming.deliver = AsyncMock(side_effect=lambda **kw: asyncio.sleep(10))

        await handler.handle(incoming_message)
        assert handler.get_active_count() == 1

        await handler.cancel_all(timeout=1.0)
        assert handler.get_active_count() == 0

    async def test_cancel_all_no_active_tasks(self, handler):
        await handler.cancel_all(timeout=1.0)
        assert handler.get_active_count() == 0

    async def test_task_removed_after_completion(self, handler, incoming_message):
        await handler.handle(incoming_message)
        await asyncio.sleep(0.1)

        assert handler.get_active_count() == 0

    async def test_conversation_id_cached_after_delivery(self, handler, incoming_message):
        handler._user_identity.resolve = MagicMock(return_value=MagicMock(user_id="user_abc", conversation_id=None))
        handler._streaming.deliver = AsyncMock(
            return_value=DeliveryResult(response_text="Hello!", conversation_id="conv_new_456")
        )

        await handler.handle(incoming_message)
        await asyncio.sleep(0.1)

        handler._user_identity.set_conversation_id.assert_called_once_with("user_abc", "conv_new_456")

    async def test_conversation_id_not_updated_when_same(self, handler, incoming_message):
        handler._user_identity.resolve = MagicMock(
            return_value=MagicMock(user_id="user_abc", conversation_id="conv_123")
        )
        handler._streaming.deliver = AsyncMock(
            return_value=DeliveryResult(response_text="Hello!", conversation_id="conv_123")
        )

        await handler.handle(incoming_message)
        await asyncio.sleep(0.1)

        handler._user_identity.set_conversation_id.assert_not_called()

    async def test_delivery_error_sends_user_message(self, handler, transport, incoming_message):
        handler._streaming.deliver = AsyncMock(
            return_value=DeliveryResult(response_text="", conversation_id=None, error="API rate limit exceeded")
        )

        await handler.handle(incoming_message)
        await asyncio.sleep(0.1)

        assert transport.messages[-1].text == handler._config.error_message
        handler._user_identity.set_conversation_id.assert_not_called()

    async def test_full_message_flow(self, handler):
        identity = MagicMock(user_id="user_abc", conversation_id=None, is_new=True)
        handler._user_identity.resolve = MagicMock(return_value=identity)
        handler._streaming.deliver = AsyncMock(
            return_value=DeliveryResult(
                response_text="Hello! How can I help?",
                conversation_id="conv_789",
                usage={"total_tokens": 25},
                message_ids=["msg_1", "msg_2"],
            )
        )

        incoming = _make_msg("chat_456", "What is AI?", sender_id="user_789", message_id="msg_123")

        await handler.handle(incoming)
        await asyncio.sleep(0.1)

        handler._user_identity.resolve.assert_called_once_with(incoming)
        handler._streaming.deliver.assert_called_once_with(
            chat_id="chat_456",
            ai_client=handler._command_service.ai_client,
            prompt="What is AI?",
            conversation_id=None,
        )
        handler._user_identity.set_conversation_id.assert_called_once_with("user_abc", "conv_789")
        assert handler.get_active_count() == 0

    async def test_user_client_manager_gets_chat_context(self, handler, incoming_message):
        manager = MagicMock()
        manager.get_or_create = AsyncMock(return_value=MagicMock())
        handler._user_client_manager = manager

        await handler.handle(incoming_message)
        await asyncio.sleep(0.1)

        manager.set_chat_context.assert_called_once_with("user_abc", "chat_456")
        assert handler._streaming.deliver.call_args.kwargs["ai_client"] is manager.get_or_create.return_value

    async def test_command_reply_is_sent_without_reaching_the_ai(self, handler, transport):
        dispatcher = MagicMock()
        dispatcher.try_dispatch = AsyncMock(return_value=CommandResult(success=True, message="Status: ok"))
        handler._command_dispatcher = dispatcher

        await handler.handle(_make_msg("chat_1", "/status"))

        assert [(m.chat_id, m.text) for m in transport.messages] == [("chat_1", "Status: ok")]
        handler._streaming.deliver.assert_not_called()


@pytest.mark.asyncio
class TestConsentReplies:
    @pytest.fixture(autouse=True)
    def _clear_pending(self):
        PendingConsents._pending.clear()
        yield
        PendingConsents._pending.clear()

    @pytest.mark.parametrize(
        ("reply", "expected", "confirmation"),
        [("ya", "yes_all", "Approved all."), ("Y", "yes", "Approved."), ("nope", "no", "Denied.")],
    )
    async def test_reply_resolves_pending_consent(self, handler, transport, reply, expected, confirmation):
        future: Future[str] = Future()
        PendingConsents.add("chat_1", future)

        await handler.handle(_make_msg("chat_1", reply, message_id="m9"))

        assert future.result(timeout=1) == expected
        assert transport.messages[-1].text == confirmation
        assert transport.messages[-1].kwargs == {"reply_to_message_id": "m9"}
        handler._streaming.deliver.assert_not_called()
