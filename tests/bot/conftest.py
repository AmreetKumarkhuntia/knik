"""Shared fixtures for the bot tests: an in-memory MessagingTransport instead of Telegram."""

from __future__ import annotations

from collections.abc import AsyncIterator, Awaitable, Callable
from dataclasses import dataclass, field
from typing import Any

import pytest

from lib.services.telegram.models import BotCommand, IncomingMessage, MessageResult


@dataclass
class Sent:
    chat_id: str
    text: str
    kwargs: dict[str, Any] = field(default_factory=dict)


class FakeTransport:
    """Records everything the bot sends. Set `stream_error` or `stream_message_ids` to shape send_stream results."""

    def __init__(self) -> None:
        self.messages: list[Sent] = []
        self.streams: list[Sent] = []
        self.commands: list[BotCommand] = []
        self.on_message: Callable[[IncomingMessage], Awaitable[None]] | None = None
        self.stopped = False
        self.stream_error: Exception | None = None
        self.stream_message_ids: list[str | None] = []

    async def start(self, on_message: Callable[[IncomingMessage], Awaitable[None]]) -> None:
        self.on_message = on_message

    async def stop(self) -> None:
        self.stopped = True

    async def send_message(self, chat_id: str, text: str, **kwargs: Any) -> MessageResult:
        self.messages.append(Sent(chat_id, text, kwargs))
        return MessageResult(success=True, message_id=f"msg_{len(self.messages)}")

    async def send_stream(self, chat_id: str, text_stream: AsyncIterator[str], **kwargs: Any) -> MessageResult:
        if self.stream_error is not None:
            raise self.stream_error
        text = "".join([chunk async for chunk in text_stream])
        self.streams.append(Sent(chat_id, text, kwargs))
        if self.stream_message_ids:
            return MessageResult(success=True, message_id=self.stream_message_ids.pop(0))
        return MessageResult(success=True, message_id=f"stream_{len(self.streams)}")

    async def register_commands(self, commands: list[BotCommand]) -> None:
        self.commands = list(commands)


@pytest.fixture
def transport() -> FakeTransport:
    return FakeTransport()
