"""Shared fixtures for the bot tests: an in-memory MessagingTransport instead of Telegram, and users in memory."""

from __future__ import annotations

import uuid
from collections.abc import AsyncIterator, Awaitable, Callable
from dataclasses import dataclass, field
from typing import Any

import pytest

from lib.services.db.connection import DatabaseUnavailable
from lib.services.db.models import User
from lib.services.telegram.models import BotCommand, IncomingMessage, MessageResult


@dataclass
class Sent:
    chat_id: str
    text: str
    kwargs: dict[str, Any] = field(default_factory=dict)


class FakeTransport:
    """Records everything the bot sends.

    `stream_error` makes send_stream raise and `stream_message_ids` sets the ids it returns; `send_failure` and
    `stream_failure` make send_message and send_stream report a failed delivery, as TelegramClient does.
    """

    def __init__(self) -> None:
        self.messages: list[Sent] = []
        self.streams: list[Sent] = []
        self.commands: list[BotCommand] = []
        self.on_message: Callable[[IncomingMessage], Awaitable[None]] | None = None
        self.stopped = False
        self.stream_error: Exception | None = None
        self.stream_message_ids: list[str | None] = []
        self.send_failure: str | None = None
        self.stream_failure: str | None = None

    async def start(self, on_message: Callable[[IncomingMessage], Awaitable[None]]) -> None:
        self.on_message = on_message

    async def stop(self) -> None:
        self.stopped = True

    async def send_message(self, chat_id: str, text: str, **kwargs: Any) -> MessageResult:
        if self.send_failure is not None:
            return MessageResult(success=False, error=self.send_failure)
        self.messages.append(Sent(chat_id, text, kwargs))
        return MessageResult(success=True, message_id=f"msg_{len(self.messages)}")

    async def send_stream(self, chat_id: str, text_stream: AsyncIterator[str], **kwargs: Any) -> MessageResult:
        if self.stream_error is not None:
            raise self.stream_error
        text = "".join([chunk async for chunk in text_stream])
        if self.stream_failure is not None:
            return MessageResult(success=False, error=self.stream_failure)
        self.streams.append(Sent(chat_id, text, kwargs))
        if self.stream_message_ids:
            return MessageResult(success=True, message_id=self.stream_message_ids.pop(0))
        return MessageResult(success=True, message_id=f"stream_{len(self.streams)}")

    async def register_commands(self, commands: list[BotCommand]) -> None:
        self.commands = list(commands)


@pytest.fixture
def transport() -> FakeTransport:
    return FakeTransport()


class FakeUsers:
    """Stands in for UserDB: users rows that outlive any one UserIdentityManager, as Postgres's do across restarts.

    Set `unavailable` to make lookups fail like a stopped Postgres.
    """

    def __init__(self) -> None:
        self.rows: dict[tuple[str, str], User] = {}
        self.unavailable = False
        self.lookups = 0

    async def get_or_create(self, source: str, external_id: str, display_name: str | None = None) -> User:
        self.lookups += 1
        if self.unavailable:
            raise DatabaseUnavailable("Postgres unavailable")
        key = (source, external_id)
        if key not in self.rows:
            self.rows[key] = User(f"usr_{uuid.uuid4().hex[:12]}", source, external_id, display_name)
        return self.rows[key]


@pytest.fixture(autouse=True)
def users(monkeypatch) -> FakeUsers:
    """Every bot test looks its senders up here; a test that needs Postgres puts the real UserDB back."""
    store = FakeUsers()
    monkeypatch.setattr("bot.user_identity.UserDB", store)
    return store
