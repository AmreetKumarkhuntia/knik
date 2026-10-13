"""The console's command replies: the shared commands, word for word the bot's, and the console's own."""

import pytest

from console.commands import create_command_system
from console.identity import ConsoleIdentity
from lib.commands.service import CommandService
from tests.lib.commands import fakes, golden


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
    return ConsoleIdentity()


@pytest.fixture
def resolved():
    """The user ids the service asked a client for."""
    return []


@pytest.fixture
def dispatcher(client, identity, conversations, resolved):
    async def resolve(user_id):
        resolved.append(user_id)
        return client

    service = CommandService(client_resolver=resolve, user_identity=identity)
    return create_command_system(service)[1]


@pytest.mark.parametrize("case", golden.SHARED_CASES, ids=lambda c: c.id)
def test_shared_command_reply(case, dispatcher, identity, conversations, client):
    golden.prepare(case, conversations, client)
    if case.conversation:
        identity.set_conversation_id(identity.user_id, case.conversation)

    result = dispatcher.try_dispatch(case.text)

    assert result is not None
    assert (result.success, result.message) == (case.success, case.message)


def test_new_starts_a_fresh_session(dispatcher, identity):
    identity.set_conversation_id(identity.user_id, "11111111-aaaa")

    result = dispatcher.try_dispatch("/new")

    assert (result.success, result.message) == (True, golden.CONSOLE_NEW)
    assert identity.get_conversation_id(identity.user_id) is None


def test_help_lists_shared_and_console_commands(dispatcher):
    result = dispatcher.try_dispatch("/help")

    assert (result.success, result.message) == (True, golden.CONSOLE_HELP)


@pytest.mark.parametrize("text", ["/revoke", "/start", "/exit", "/nope", "hello", "/"])
def test_other_input_is_left_to_the_console(dispatcher, text):
    assert dispatcher.try_dispatch(text) is None


def test_resume_moves_the_console_into_the_conversation(dispatcher, identity):
    dispatcher.try_dispatch("/resume #2")

    assert identity.get_conversation_id(identity.user_id) == "22222222-bbbb"


def test_status_data(dispatcher, identity, conversations):
    conversations.usage["11111111-aaaa"] = golden.FULL_USAGE
    identity.set_conversation_id(identity.user_id, "11111111-aaaa")

    result = dispatcher.try_dispatch("/status")

    assert result.data == golden.STATUS_FULL_DATA


def test_model_and_provider_switch_the_client(dispatcher, client, resolved):
    dispatcher.try_dispatch("/model gemini-2.5-pro")
    dispatcher.try_dispatch("/provider vertex")

    assert client.model == "gemini-2.5-pro"
    assert client.provider_switches == [("vertex", "gemini-2.5-pro")]
    assert resolved == ["console_user", "console_user"]


@pytest.mark.parametrize("text", ["/new", "/sessions", "/resume", "/resume #1", "/help", "/provider nope"])
def test_commands_that_need_no_client_do_not_ask_for_one(dispatcher, resolved, text):
    dispatcher.try_dispatch(text)

    assert resolved == []


def test_a_failing_handler_reports_the_error(dispatcher, monkeypatch):
    monkeypatch.setattr(fakes.FakeConversations, "list_conversations", None)

    result = dispatcher.try_dispatch("/sessions")

    assert (result.success, result.message) == (False, "Error executing command: 'NoneType' object is not callable")
