"""Tests for CommandService: it works on the caller's AI client, found through the app's client resolver."""

import asyncio

import pytest

from lib.commands.handlers import format_status
from lib.commands.service import CommandService
from lib.services.ai_client.client import AIClient
from lib.services.ai_client.factory import build_client
from lib.services.ai_client.settings import ClientSettings
from lib.services.db import UserDB
from lib.services.db.repositories.conversations import ConversationDB, ConversationScope
from tests.db_support import requires_db

from . import fakes


class _Identity:
    """A bot's users: each sees only their own conversations. With `local`, the console's single user."""

    def __init__(self, local: bool = False) -> None:
        self.conversations: dict[str, str | None] = {}
        self.local = local

    def get_conversation_id(self, user_id: str) -> str | None:
        return self.conversations.get(user_id)

    def set_conversation_id(self, user_id: str, conversation_id: str) -> None:
        self.conversations[user_id] = conversation_id

    def clear_conversation_id(self, user_id: str) -> None:
        self.conversations[user_id] = None

    def conversation_scope(self, user_id: str) -> ConversationScope:
        return ConversationScope.local() if self.local else ConversationScope.owned_by(user_id)


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
    await service.list_sessions("alice")
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


async def _bot_user(name: str) -> str:
    return (await UserDB.get_or_create("telegram", name)).id


@requires_db
@pytest.mark.asyncio
async def test_resume_finds_conversations_in_postgres(db, service):
    alice = await _bot_user("alice")
    older = await ConversationDB.create_conversation("Older", user_id=alice, source="telegram")
    newer = await ConversationDB.create_conversation("Newer", user_id=alice, source="telegram")
    await ConversationDB.append_message(newer, "user", "hi")
    await ConversationDB.append_message(newer, "assistant", "hello")

    by_index = await service.resume_session(alice, "#2")
    by_prefix = await service.resume_session(alice, newer[:8])
    missing = await service.resume_session(alice, "ffffffff")

    assert by_index.message == "Resumed: Older (0 messages)"
    assert by_index.data["conversation_id"] == older
    assert by_prefix.message == "Resumed: Newer (2 messages)"
    assert service._user_identity.get_conversation_id(alice) == newer
    assert (missing.success, missing.message) == (False, "Could not find conversation: ffffffff")
    sessions = await service.list_sessions(alice)
    assert [(s.title, s.message_count) for s in sessions] == [("Newer", 2), ("Older", 0)]


async def _one_of_each() -> dict[str, str]:
    """A conversation of each kind, oldest first: two bot users', the web's and a legacy one."""
    alice, bob = await _bot_user("alice"), await _bot_user("bob")
    conversations = {
        "alice": await ConversationDB.create_conversation("Alice's", user_id=alice, source="telegram"),
        "bob": await ConversationDB.create_conversation("Bob's", user_id=bob, source="telegram"),
        "web": await ConversationDB.create_conversation("Web", source="web"),
        "legacy": await ConversationDB.create_conversation("Legacy"),
    }
    return {"alice_id": alice, **conversations}


@requires_db
@pytest.mark.asyncio
async def test_a_bot_user_lists_and_resumes_only_their_own_conversations(db, service):
    made = await _one_of_each()
    alice = made["alice_id"]

    assert [s.title for s in await service.list_sessions(alice)] == ["Alice's"]
    for other in ("bob", "web", "legacy"):
        for ref in (made[other], made[other][:8]):
            result = await service.resume_session(alice, ref)
            assert (result.success, result.message) == (False, f"Could not find conversation: {ref}")
    assert (await service.resume_session(alice, "#2")).message == "Could not find conversation: #2"
    assert service._user_identity.get_conversation_id(alice) is None

    resumed = await service.resume_session(alice, made["alice"][:8])
    assert resumed.message == "Resumed: Alice's (0 messages)"


@requires_db
@pytest.mark.asyncio
async def test_the_console_lists_and_resumes_the_web_and_legacy_conversations(db):
    made = await _one_of_each()
    service = CommandService(client_resolver=None, user_identity=_Identity(local=True))

    assert [s.title for s in await service.list_sessions("console_user")] == ["Legacy", "Web"]
    for bot_user in ("alice", "bob"):
        result = await service.resume_session("console_user", made[bot_user])
        assert result.success is False
    assert (await service.resume_session("console_user", made["web"])).message == "Resumed: Web (0 messages)"
    assert (await service.resume_session("console_user", "#1")).message == "Resumed: Legacy (0 messages)"


@requires_db
@pytest.mark.asyncio
async def test_status_totals_the_tokens_of_every_turn(db):
    client = build_client(ClientSettings(provider="mock"))

    async def resolve(user_id):
        return client

    identity = _Identity()
    service = CommandService(client_resolver=resolve, user_identity=identity)

    _, conversation_id, first = await client.achat("hello")
    _, _, second = await client.achat("and again", conversation_id=conversation_id)
    await asyncio.gather(*AIClient._background_tasks)
    identity.set_conversation_id("alice", conversation_id)

    status = await service.get_status("alice")

    assert first["total_tokens"] == second["total_tokens"] == 25
    assert status.total_tokens == 50
    assert "  Tokens:   20 in / 30 out / 50 total\n" in format_status(status).message
