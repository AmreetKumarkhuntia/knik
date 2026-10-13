"""Tests for BotMessageHandler."""

import asyncio
from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from bot.commands import create_command_system
from bot.consent import BotConsentGate, ConsentBroker
from bot.message_handler import BotMessageHandler
from bot.streaming import DeliveryResult, StreamingResponseManager
from bot.user_client_manager import UserClientManager
from bot.user_identity import UserIdentityManager
from lib.commands.models import CommandResult
from lib.commands.service import CommandService
from lib.services.telegram.models import IncomingMessage
from lib.tools.consent import ConsentRequest
from tests.lib.commands import fakes


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
    config.busy_message = "Still busy, send it again."
    config.bot_concurrent_limit = 10
    return config


@pytest.fixture
def mock_user_clients():
    manager = MagicMock()
    manager.get_or_create = AsyncMock(return_value=MagicMock(name="user_client"))
    return manager


@pytest.fixture
def mock_user_identity():
    manager = MagicMock()
    manager.resolve = MagicMock(return_value=MagicMock(user_id="user_abc", is_new=False, conversation_id=None))
    manager.set_conversation_id = MagicMock()
    manager.get_user_id_for_sender = MagicMock(side_effect=lambda sender: f"usr_{sender}" if sender else None)
    return manager


@pytest.fixture
def broker():
    return ConsentBroker()


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
def handler(transport, mock_user_identity, mock_streaming, mock_config, mock_user_clients, broker):
    return BotMessageHandler(
        transport=transport,
        user_identity=mock_user_identity,
        streaming_manager=mock_streaming,
        config=mock_config,
        user_client_manager=mock_user_clients,
        consent_broker=broker,
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

    async def test_a_message_while_busy_gets_the_busy_reply_and_not_the_ai(self, handler, transport, incoming_message):
        async def delay(**kw):
            await asyncio.sleep(1)

        handler._streaming.deliver = AsyncMock(side_effect=delay)

        await handler.handle(incoming_message)
        assert handler.get_active_count() == 1

        await handler.handle(_make_msg("chat_456", "and another thing", message_id="msg_124"))
        await asyncio.sleep(0.05)

        assert [(m.text, m.kwargs) for m in transport.messages] == [
            ("Still busy, send it again.", {"reply_to_message_id": "msg_124"})
        ]
        assert [c.kwargs["prompt"] for c in handler._streaming.deliver.await_args_list] == ["Hello, bot!"]
        await handler.cancel_all(timeout=1.0)

    async def test_a_chat_is_free_again_as_soon_as_its_reply_is_done(self, handler, transport):
        await handler.handle(_make_msg("chat_1", "first"))
        task = next(iter(handler._active_tasks.values()))
        await task

        await handler.handle(_make_msg("chat_1", "second"))
        await asyncio.sleep(0.05)

        assert transport.messages == []
        assert handler._streaming.deliver.await_count == 2

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
            ai_client=handler._user_client_manager.get_or_create.return_value,
            prompt="What is AI?",
            conversation_id=None,
        )
        handler._user_identity.set_conversation_id.assert_called_once_with("user_abc", "conv_789")
        assert handler.get_active_count() == 0

    async def test_user_client_manager_gets_chat_context(self, handler, incoming_message, mock_user_clients):
        await handler.handle(incoming_message)
        await asyncio.sleep(0.1)

        mock_user_clients.set_chat_context.assert_called_once_with("user_abc", "chat_456")
        mock_user_clients.get_or_create.assert_awaited_once_with("user_abc")
        assert handler._streaming.deliver.call_args.kwargs["ai_client"] is mock_user_clients.get_or_create.return_value

    async def test_command_reply_is_sent_without_reaching_the_ai(self, handler, transport):
        dispatcher = MagicMock()
        dispatcher.try_dispatch = AsyncMock(return_value=CommandResult(success=True, message="Status: ok"))
        handler._command_dispatcher = dispatcher

        await handler.handle(_make_msg("chat_1", "/status"))

        assert [(m.chat_id, m.text) for m in transport.messages] == [("chat_1", "Status: ok")]
        handler._streaming.deliver.assert_not_called()

    async def test_a_failing_command_gets_the_error_and_never_reaches_the_ai(self, handler, transport):
        dispatcher = MagicMock()
        dispatcher.try_dispatch = AsyncMock(side_effect=RuntimeError("identity store broke"))
        handler._command_dispatcher = dispatcher

        await handler.handle(_make_msg("chat_1", "/status", message_id="m7"))
        await asyncio.sleep(0.05)

        assert [(m.text, m.kwargs) for m in transport.messages] == [
            (handler._config.error_message, {"reply_to_message_id": "m7"})
        ]
        handler._streaming.deliver.assert_not_called()

    async def test_a_command_runs_while_a_reply_is_streaming(self, handler, transport):
        release = asyncio.Event()

        async def deliver(**kw):
            await release.wait()
            return DeliveryResult(response_text="The end.")

        handler._streaming.deliver = AsyncMock(side_effect=deliver)
        dispatcher = MagicMock()
        dispatcher.try_dispatch = AsyncMock(return_value=CommandResult(success=True, message="Status: ok"))
        handler._command_dispatcher = dispatcher

        await handler.handle(_make_msg("chat_1", "tell me a story"))
        await handler.handle(_make_msg("chat_1", "/status"))

        assert [m.text for m in transport.messages] == ["Status: ok"]
        assert handler.get_active_count() == 1
        release.set()
        await handler.cancel_all(timeout=1.0)

    async def test_new_during_a_reply_is_not_undone_when_the_reply_lands(
        self, transport, mock_streaming, mock_config, mock_user_clients, broker
    ):
        identity = UserIdentityManager()
        service = CommandService(client_resolver=mock_user_clients.get_or_create, user_identity=identity)
        _, dispatcher = create_command_system(service, mock_user_clients)
        handler = BotMessageHandler(
            transport=transport,
            user_identity=identity,
            streaming_manager=mock_streaming,
            config=mock_config,
            user_client_manager=mock_user_clients,
            consent_broker=broker,
            command_dispatcher=dispatcher,
        )
        release = asyncio.Event()

        async def deliver(**kw):
            await release.wait()
            return DeliveryResult(response_text="Once upon a time", conversation_id="conv_story")

        mock_streaming.deliver = AsyncMock(side_effect=deliver)

        await handler.handle(_make_msg("chat_1", "tell me a story"))
        await asyncio.sleep(0)
        await handler.handle(_make_msg("chat_1", "/new", message_id="m2"))
        release.set()
        await asyncio.sleep(0.05)

        user_id = identity.get_user_id_for_sender("user_1")
        assert transport.messages[0].text.startswith("New session started.")
        assert identity.get_conversation_id(user_id) is None

    async def test_an_undelivered_reply_is_reported_and_its_conversation_kept(self, handler, transport):
        handler._streaming.deliver = AsyncMock(
            return_value=DeliveryResult(
                response_text="Hello!", conversation_id="conv_9", send_errors=["Bad Request: message is too long"]
            )
        )

        await handler.handle(_make_msg("chat_1", "hi", message_id="m3"))
        await asyncio.sleep(0.05)

        assert [(m.text, m.kwargs) for m in transport.messages] == [
            (handler._config.error_message, {"reply_to_message_id": "m3"})
        ]
        handler._user_identity.set_conversation_id.assert_called_once_with("user_abc", "conv_9")

    async def test_replies_beyond_the_concurrency_limit_wait_for_a_slot(
        self, transport, mock_streaming, mock_config, mock_user_identity, mock_user_clients, broker
    ):
        mock_config.bot_concurrent_limit = 1
        handler = BotMessageHandler(
            transport=transport,
            user_identity=mock_user_identity,
            streaming_manager=mock_streaming,
            config=mock_config,
            user_client_manager=mock_user_clients,
            consent_broker=broker,
        )
        release = asyncio.Event()
        started: list[str] = []

        async def deliver(**kw):
            started.append(kw["chat_id"])
            await release.wait()
            return DeliveryResult(response_text="ok")

        mock_streaming.deliver = AsyncMock(side_effect=deliver)

        await handler.handle(_make_msg("chat_1", "one"))
        await handler.handle(_make_msg("chat_2", "two"))
        await asyncio.sleep(0.05)
        assert (started, handler.get_active_count()) == (["chat_1"], 2)

        release.set()
        await asyncio.sleep(0.05)
        assert started == ["chat_1", "chat_2"]
        assert handler.get_active_count() == 0

    async def test_a_reply_the_transport_could_not_send_is_logged(self, handler, transport):
        transport.send_failure = "Forbidden: bot was blocked by the user"
        dispatcher = MagicMock()
        dispatcher.try_dispatch = AsyncMock(return_value=CommandResult(success=True, message="Status: ok"))
        handler._command_dispatcher = dispatcher

        with patch("bot.message_handler.printer") as printer:
            await handler.handle(_make_msg("chat_1", "/status"))

        warning = printer.warning.call_args.args[0]
        assert "chat_1" in warning
        assert "Forbidden: bot was blocked by the user" in warning

    async def test_command_results_are_only_sent(self, handler, transport, mock_user_clients):
        # The old side channels: the handler used to patch the user's client from these keys.
        data = {"new_model": "m", "new_provider": "p", "revoke_consent": True}
        dispatcher = MagicMock()
        dispatcher.try_dispatch = AsyncMock(return_value=CommandResult(success=True, message="ok", data=data))
        handler._command_dispatcher = dispatcher

        await handler.handle(_make_msg("chat_1", "/new"))

        assert mock_user_clients.method_calls == []
        assert [m.text for m in transport.messages] == ["ok"]


@pytest.mark.asyncio
class TestConsentReplies:
    @pytest.mark.parametrize(
        ("reply", "expected", "confirmation"),
        [("ya", "yes_all", "Approved all."), ("Y", "yes", "Approved."), ("nope", "no", "Denied.")],
    )
    async def test_reply_resolves_pending_consent(self, handler, transport, broker, reply, expected, confirmation):
        future = broker.add("chat_1", "usr_user_1")

        await handler.handle(_make_msg("chat_1", reply, message_id="m9"))

        assert future.result(timeout=1) == expected
        assert transport.messages[-1].text == confirmation
        assert transport.messages[-1].kwargs == {"reply_to_message_id": "m9"}
        handler._streaming.deliver.assert_not_called()

    async def test_an_answer_while_the_reply_waits_for_it_is_taken_not_dropped(self, handler, transport, broker):
        release = asyncio.Event()

        async def deliver(**kw):
            await release.wait()
            return DeliveryResult(response_text="Deleted.")

        handler._streaming.deliver = AsyncMock(side_effect=deliver)
        await handler.handle(_make_msg("chat_1", "delete the logs"))
        future = broker.add("chat_1", "usr_user_1")

        await handler.handle(_make_msg("chat_1", "y", message_id="m9"))

        assert future.result(timeout=1) == "yes"
        assert [m.text for m in transport.messages] == ["Approved."]
        release.set()
        await handler.cancel_all(timeout=1.0)

    async def test_another_users_message_in_the_chat_is_not_an_answer(self, handler, broker):
        future = broker.add("group", "usr_user_1")

        await handler.handle(_make_msg("group", "yes", sender_id="user_2"))
        await asyncio.sleep(0.1)

        assert not future.done()
        assert broker.has_pending("group", "usr_user_1")
        handler._streaming.deliver.assert_awaited_once()

    async def test_the_users_message_in_another_chat_is_not_an_answer(self, handler, broker):
        future = broker.add("dm", "usr_user_1")

        await handler.handle(_make_msg("group", "yes"))
        await asyncio.sleep(0.1)

        assert not future.done()
        handler._streaming.deliver.assert_awaited_once()

    async def test_after_a_timed_out_prompt_the_next_message_reaches_the_ai(self, handler, transport, broker):
        gate = BotConsentGate(
            user_id="usr_user_1",
            current_chat=lambda: "chat_1",
            transport=transport,
            loop=asyncio.get_running_loop(),
            broker=broker,
        )
        request = ConsentRequest(tool_name="shell", kwargs={"command": "ls"})

        assert await asyncio.to_thread(gate.request_sync, request, 0.1) == "no"
        await handler.handle(_make_msg("chat_1", "what about now?"))
        await asyncio.sleep(0.1)

        assert [m.text for m in transport.messages] == ["Allow shell(command='ls')? Reply yes (y) / yes all (ya) / no"]
        assert handler._streaming.deliver.call_args.kwargs["prompt"] == "what about now?"


@pytest.mark.asyncio
async def test_model_and_provider_commands_change_the_senders_own_client(
    transport, mock_streaming, mock_config, broker, monkeypatch
):
    """End to end from Telegram text to the client the sender's next message is answered with."""
    built: list[fakes.FakeClient] = []

    def build_client(settings, tool_registry=None):
        built.append(fakes.FakeClient())
        return built[-1]

    monkeypatch.setattr("bot.user_client_manager.build_client", build_client)
    monkeypatch.setattr("bot.user_client_manager.create_tool_registry", lambda consent_gate=None: None)
    monkeypatch.setattr("lib.commands.service.ProviderRegistry", fakes.FakeProviderRegistry)

    identity = UserIdentityManager()
    user_clients = UserClientManager(ai_provider="mock", transport=transport, loop=asyncio.get_running_loop())
    service = CommandService(client_resolver=user_clients.get_or_create, user_identity=identity)
    _, dispatcher = create_command_system(service, user_clients)
    handler = BotMessageHandler(
        transport=transport,
        user_identity=identity,
        streaming_manager=mock_streaming,
        config=mock_config,
        user_client_manager=user_clients,
        consent_broker=broker,
        command_dispatcher=dispatcher,
    )

    await handler.handle(_make_msg("chat_1", "/model gemini-2.5-pro", sender_id="alice"))
    await handler.handle(_make_msg("chat_1", "/provider vertex", sender_id="alice"))
    await handler.handle(_make_msg("chat_2", "hello", sender_id="alice"))
    await handler.handle(_make_msg("chat_3", "hello", sender_id="bob"))
    await asyncio.sleep(0.1)

    assert [m.text for m in transport.messages] == ["Model switched to gemini-2.5-pro", "Provider switched to vertex"]
    alice, bob = built
    assert (alice.model, alice.provider_name) == ("gemini-2.5-pro", "vertex")
    assert (bob.model, bob.provider_name) == ("gemini-2.5-flash", "mock")
    clients_used = {c.kwargs["chat_id"]: c.kwargs["ai_client"] for c in mock_streaming.deliver.call_args_list}
    assert clients_used == {"chat_2": alice, "chat_3": bob}
