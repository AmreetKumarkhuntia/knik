"""Tests for CommandService: it works on the caller's AI client, found through the app's client resolver."""

import pytest

from lib.commands.service import CommandService
from lib.services.db.repositories.conversations import ConversationDB
from tests.db_support import requires_db

from . import fakes


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
def clients():
    return {"alice": fakes.FakeClient(), "bob": fakes.FakeClient(provider="vertex", model="gemini-2.5-pro")}


@pytest.fixture
def resolved():
    return []


@pytest.fixture
def service(clients, resolved):
    async def resolve(user_id):
        resolved.append(user_id)
        return clients[user_id]

    return CommandService(client_resolver=resolve, user_identity=_Identity())


@pytest.fixture
def fake_db(monkeypatch):
    store = fakes.FakeConversations()
    fakes.install(monkeypatch, store)
    return store


@pytest.mark.asyncio
async def test_switch_model_changes_only_the_callers_client(service, clients):
    result = await service.switch_model("bob", "gemini-2.5-flash")

    assert result.data == {"old_model": "gemini-2.5-pro", "new_model": "gemini-2.5-flash"}
    assert clients["bob"].model == "gemini-2.5-flash"
    assert clients["alice"].model == "gemini-2.5-flash"
    assert clients["alice"].provider_switches == []


@pytest.mark.asyncio
async def test_switch_provider_keeps_the_callers_model(service, clients, fake_db):
    result = await service.switch_provider("bob", "gemini")

    assert result.data == {"old_provider": "vertex", "new_provider": "gemini"}
    assert clients["bob"].provider_switches == [("gemini", "gemini-2.5-pro")]
    assert clients["alice"].provider_name == "mock"


@pytest.mark.asyncio
async def test_status_and_models_describe_the_callers_client(service, fake_db):
    alice = await service.get_status("alice")
    bob = await service.get_status("bob")

    assert (alice.provider, alice.model, alice.user_id) == ("mock", "gemini-2.5-flash", "alice")
    assert (bob.provider, bob.model, bob.user_id) == ("vertex", "gemini-2.5-pro", "bob")
    assert [m.name for m in await service.list_models("bob")] == ["gemini-2.5-flash", "gemini-2.5-pro", "plain-model"]


@pytest.mark.asyncio
async def test_operations_without_a_client_never_resolve_one(service, resolved, fake_db):
    await service.new_session("alice")
    await service.resume_session("alice", "#1")
    await service.list_sessions()
    await service.switch_provider("alice", "not-a-provider")
    assert service.list_providers() == ["gemini", "mock", "vertex"]

    assert resolved == []


@pytest.mark.asyncio
async def test_a_failing_resolver_reaches_the_caller(fake_db):
    async def resolve(user_id):
        raise RuntimeError("no client for you")

    service = CommandService(client_resolver=resolve, user_identity=_Identity())

    with pytest.raises(RuntimeError, match="no client for you"):
        await service.get_status("alice")


@requires_db
@pytest.mark.asyncio
async def test_resume_finds_conversations_in_postgres(db, service):
    older = await ConversationDB.create_conversation("Older")
    newer = await ConversationDB.create_conversation("Newer")
    await ConversationDB.append_message(newer, "user", "hi")
    await ConversationDB.append_message(newer, "assistant", "hello")

    by_index = await service.resume_session("alice", "#2")
    by_prefix = await service.resume_session("alice", newer[:8])
    missing = await service.resume_session("alice", "ffffffff")

    assert by_index.message == "Resumed: Older (0 messages)"
    assert by_index.data["conversation_id"] == older
    assert by_prefix.message == "Resumed: Newer (2 messages)"
    assert service._user_identity.get_conversation_id("alice") == newer
    assert (missing.success, missing.message) == (False, "Could not find conversation: ffffffff")
    assert [s.title for s in await service.list_sessions()] == ["Newer", "Older"]
