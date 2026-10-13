"""End to end against Postgres: each Telegram user's chats are theirs, and stay theirs after a bot restart."""

import asyncio

import pytest

from bot.commands import create_command_system
from bot.config import BotConfig
from bot.consent import ConsentBroker
from bot.message_handler import BotMessageHandler
from bot.streaming import StreamingResponseManager
from bot.user_client_manager import UserClientManager
from bot.user_identity import UserIdentityManager
from lib.commands.service import CommandService
from lib.services.db import ConversationDB, ConversationScope, UserDB
from lib.services.telegram.models import IncomingMessage
from tests.db_support import requires_db


pytestmark = pytest.mark.asyncio


class Bot:
    """The bot's message path with the mock AI provider; a new Bot is a restart (nothing kept in memory)."""

    def __init__(self, transport) -> None:
        config = BotConfig()
        config.ai_provider = "mock"
        self.transport = transport
        self.identity = UserIdentityManager()
        clients = UserClientManager(ai_provider="mock")
        service = CommandService(client_resolver=clients.get_or_create, user_identity=self.identity)
        self.handler = BotMessageHandler(
            transport=transport,
            user_identity=self.identity,
            streaming_manager=StreamingResponseManager(transport=transport, config=config),
            config=config,
            user_client_manager=clients,
            consent_broker=ConsentBroker(),
            command_dispatcher=create_command_system(service, clients)[1],
        )

    async def send(self, sender: str, text: str) -> str:
        """What the bot answers `sender`: a command's reply, or the AI's once it is streamed and saved."""
        messages, streams = len(self.transport.messages), len(self.transport.streams)
        await self.handler.handle(IncomingMessage(chat_id=f"chat_{sender}", text=text, sender_id=sender))
        for _ in range(500):
            if self.handler.get_active_count() == 0:
                break
            await asyncio.sleep(0.01)
        # A command answers with a message, the AI with a stream.
        sent = [*self.transport.messages[messages:], *self.transport.streams[streams:]]
        assert len(sent) == 1, f"expected one answer to {text!r}, got {sent}"
        return sent[0].text

    async def user_id(self, sender: str) -> str:
        return (
            await self.identity.resolve(IncomingMessage(chat_id=f"chat_{sender}", text="", sender_id=sender))
        ).user_id


@pytest.fixture
def real_users(monkeypatch):
    monkeypatch.setattr("bot.user_identity.UserDB", UserDB)


@requires_db
async def test_each_user_lists_and_resumes_only_their_own_chats_across_a_restart(db, real_users, transport):
    web = await ConversationDB.create_conversation("Web chat", source="web")
    legacy = await ConversationDB.create_conversation("Legacy chat")
    bot = Bot(transport)

    await bot.send("alice", "hello from alice")
    await bot.send("bob", "hello from bob")
    alice, bob = await bot.user_id("alice"), await bot.user_id("bob")
    [alices] = await ConversationDB.list_conversations(ConversationScope.owned_by(alice))
    [bobs] = await ConversationDB.list_conversations(ConversationScope.owned_by(bob))
    assert (alices.source, bobs.source) == ("telegram", "telegram")

    restarted = Bot(transport)
    assert await restarted.user_id("alice") == alice

    sessions = await restarted.send("alice", "/sessions")
    assert alices.id in sessions
    assert not any(other in sessions for other in (bobs.id, web, legacy))
    for other in (bobs.id, bobs.id[:8], web, legacy, "#2"):
        assert await restarted.send("alice", f"/resume {other}") == f"Could not find conversation: {other}"
    assert (await restarted.send("alice", "/resume #1")).startswith("Resumed: ")
    assert restarted.identity.get_conversation_id(alice) == alices.id

    # The next message continues the resumed conversation instead of starting one.
    await restarted.send("alice", "and again")
    assert [c.id for c in await ConversationDB.list_conversations(ConversationScope.owned_by(alice))] == [alices.id]
    assert (await ConversationDB.get_conversation(alices.id)).message_count == 4


async def test_without_postgres_the_bot_still_answers(fresh_pool_state, monkeypatch, real_users, transport):
    # Nothing listens on port 1.
    monkeypatch.setenv("KNIK_DB_HOST", "127.0.0.1")
    monkeypatch.setenv("KNIK_DB_PORT", "1")
    monkeypatch.setenv("KNIK_DB_CONNECT_TIMEOUT", "1")
    bot = Bot(transport)

    answer = await bot.send("alice", "hello")
    assert answer and answer != BotConfig().error_message
    assert await bot.send("alice", "/sessions") == "No conversations found."
    assert (await bot.user_id("alice")).startswith("usr_")
