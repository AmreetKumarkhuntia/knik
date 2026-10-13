"""Tests for the shared command handlers: their replies, on a dispatcher with nothing app-specific on it."""

import pytest

from lib.commands.handlers import SHARED_COMMANDS, register_shared_commands
from lib.commands.registry import CommandDispatcher, CommandRegistry
from lib.commands.service import CommandService

from . import fakes, golden


class _Identity:
    def __init__(self) -> None:
        self.conversations: dict[str, str | None] = {}

    def get_conversation_id(self, user_id: str) -> str | None:
        return self.conversations.get(user_id)

    def set_conversation_id(self, user_id: str, conversation_id: str) -> None:
        self.conversations[user_id] = conversation_id

    def clear_conversation_id(self, user_id: str) -> None:
        self.conversations[user_id] = None


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
    return _Identity()


@pytest.fixture
def dispatcher(client, identity, conversations):
    async def resolve(user_id):
        return client

    registry = CommandRegistry()
    register_shared_commands(registry)
    return CommandDispatcher(registry, CommandService(client_resolver=resolve, user_identity=identity))


def test_shared_commands_in_menu_order():
    registry = CommandRegistry()
    register_shared_commands(registry)

    assert [(d.name, d.description) for d in registry.get_definitions()] == [
        (name, description) for name, description, _ in SHARED_COMMANDS
    ]
    assert registry.list_commands() == ["new", "resume", "sessions", "model", "provider", "status"]


@pytest.mark.asyncio
@pytest.mark.parametrize("case", golden.SHARED_CASES, ids=lambda c: c.id)
async def test_shared_command_reply(case, dispatcher, identity, conversations, client):
    golden.prepare(case, conversations, client)
    if case.conversation:
        identity.set_conversation_id("u1", case.conversation)

    result = await dispatcher.dispatch(case.text, "u1")

    assert (result.success, result.message) == (case.success, case.message)


@pytest.mark.asyncio
async def test_new_clears_the_conversation(dispatcher, identity):
    identity.set_conversation_id("u1", "11111111-aaaa")

    result = await dispatcher.dispatch("/new", "u1")

    assert (result.success, result.message) == (True, "New session started. Send a message to begin.")
    assert identity.get_conversation_id("u1") is None


@pytest.mark.asyncio
async def test_status_data_leaves_out_the_user(dispatcher, identity, conversations):
    conversations.usage["11111111-aaaa"] = golden.FULL_USAGE
    identity.set_conversation_id("u1", "11111111-aaaa")

    result = await dispatcher.dispatch("/status", "u1")

    assert result.data == golden.STATUS_FULL_DATA
