"""The bot's command replies: the shared commands, word for word the console's, and the bot's own."""

from unittest.mock import MagicMock

import pytest

from bot.commands import create_command_system
from bot.user_identity import UserIdentityManager
from lib.commands.service import CommandService
from lib.services.telegram.models import IncomingMessage
from tests.lib.commands import fakes, golden


SENDER = "42"


@pytest.fixture
def conversations(monkeypatch):
    store = fakes.FakeConversations()
    fakes.install(monkeypatch, store)
    return store


@pytest.fixture
def client():
    return fakes.FakeClient()


@pytest.fixture
def identity():
    return UserIdentityManager()


@pytest.fixture
def user_id(identity):
    return identity.resolve(IncomingMessage(chat_id="1", text="hi", sender_id=SENDER)).user_id


@pytest.fixture
def clients(client, user_id):
    """Each user's AI client, as UserClientManager would hand them out; the default sender has `client`."""
    return {user_id: client}


@pytest.fixture
def user_clients():
    return MagicMock()


@pytest.fixture
def dispatcher(clients, identity, conversations, user_clients):
    async def resolve(user_id):
        return clients.setdefault(user_id, fakes.FakeClient())

    service = CommandService(client_resolver=resolve, user_identity=identity)
    return create_command_system(service, user_clients)[1]


async def _run(dispatcher, identity, text, sender=SENDER):
    return await dispatcher.try_dispatch(IncomingMessage(chat_id="1", text=text, sender_id=sender), identity)


@pytest.mark.asyncio
@pytest.mark.parametrize("case", golden.SHARED_CASES, ids=lambda c: c.id)
async def test_shared_command_reply(case, dispatcher, identity, user_id, conversations, client):
    golden.prepare(case, conversations, client)
    if case.conversation:
        identity.set_conversation_id(user_id, case.conversation)

    result = await _run(dispatcher, identity, case.text)

    assert result is not None
    assert (result.success, result.message) == (case.success, case.message)


@pytest.mark.asyncio
@pytest.mark.parametrize("text", ["/new", "/start", "/start@knik_bot"])
async def test_new_starts_a_fresh_session_and_lists_the_commands(text, dispatcher, identity, user_id):
    identity.set_conversation_id(user_id, "11111111-aaaa")

    result = await _run(dispatcher, identity, text)

    assert (result.success, result.message) == (True, golden.BOT_NEW)
    assert identity.get_conversation_id(user_id) is None


@pytest.mark.asyncio
async def test_help_lists_the_bot_commands(dispatcher, identity, user_id):
    result = await _run(dispatcher, identity, "/help")

    assert (result.success, result.message) == (True, golden.BOT_HELP)


@pytest.mark.asyncio
@pytest.mark.parametrize("text", ["/new", "/start"])
async def test_new_also_cleans_up_the_callers_tools(text, dispatcher, identity, user_id, user_clients):
    await _run(dispatcher, identity, text)

    user_clients.cleanup_tools.assert_called_once_with(user_id)
    user_clients.revoke_tool_consent.assert_not_called()


@pytest.mark.asyncio
async def test_revoke_withdraws_the_callers_tool_approvals(dispatcher, identity, user_id, user_clients):
    result = await _run(dispatcher, identity, "/revoke")

    assert (result.success, result.message) == (True, golden.BOT_REVOKE)
    user_clients.revoke_tool_consent.assert_called_once_with(user_id)
    user_clients.cleanup_tools.assert_not_called()


@pytest.mark.asyncio
async def test_resume_moves_the_caller_into_the_conversation(dispatcher, identity, user_id):
    await _run(dispatcher, identity, "/resume #2")

    assert identity.get_conversation_id(user_id) == "22222222-bbbb"


@pytest.mark.asyncio
async def test_status_data(dispatcher, identity, user_id, conversations):
    conversations.usage["11111111-aaaa"] = golden.FULL_USAGE
    identity.set_conversation_id(user_id, "11111111-aaaa")

    result = await _run(dispatcher, identity, "/status")

    assert result.data == golden.STATUS_FULL_DATA


@pytest.mark.asyncio
async def test_model_and_provider_switch_the_client(dispatcher, identity, user_id, client):
    await _run(dispatcher, identity, "/model gemini-2.5-pro")
    await _run(dispatcher, identity, "/provider vertex")

    assert client.model == "gemini-2.5-pro"
    assert client.provider_switches == [("vertex", "gemini-2.5-pro")]


@pytest.mark.asyncio
async def test_model_and_provider_change_only_the_callers_client(dispatcher, identity, user_id, clients, client):
    other = identity.resolve(IncomingMessage(chat_id="1", text="hi", sender_id="77")).user_id
    clients[other] = other_client = fakes.FakeClient(model="other-model")

    await _run(dispatcher, identity, "/model gemini-2.5-pro", sender="77")
    await _run(dispatcher, identity, "/provider vertex", sender="77")
    status = await _run(dispatcher, identity, "/status")

    assert (other_client.model, other_client.provider_name) == ("gemini-2.5-pro", "vertex")
    assert (client.model, client.provider_name) == ("gemini-2.5-flash", "mock")
    assert status.message == golden.STATUS_NEW_SESSION


@pytest.mark.asyncio
async def test_a_first_message_command_registers_the_sender(dispatcher, identity, clients):
    message = IncomingMessage(chat_id="1", text="/resume #2", sender_id="99")

    await dispatcher.try_dispatch(message, identity)
    await _run(dispatcher, identity, "/model gemini-2.5-pro", sender="99")

    identity_99 = identity.resolve(message)
    assert identity_99.conversation_id == "22222222-bbbb"
    assert clients[identity_99.user_id].model == "gemini-2.5-pro"
    assert None not in clients


@pytest.mark.asyncio
async def test_a_command_without_a_sender_is_not_dispatched(dispatcher, identity):
    message = IncomingMessage(chat_id="1", text="/status", sender_id=None)

    assert await dispatcher.try_dispatch(message, identity) is None


@pytest.mark.asyncio
async def test_a_failing_handler_reports_the_error(dispatcher, identity, user_id, user_clients):
    user_clients.revoke_tool_consent.side_effect = RuntimeError("registry gone")

    result = await _run(dispatcher, identity, "/revoke")

    assert (result.success, result.message) == (False, "Error executing command: registry gone")
