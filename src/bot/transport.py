"""The messaging surface the bot depends on. TelegramClient provides it in production; tests pass a fake."""

from __future__ import annotations

from collections.abc import AsyncIterator, Awaitable, Callable
from typing import TYPE_CHECKING, Any, Protocol


if TYPE_CHECKING:
    from imports import BotCommand, IncomingMessage, MessageResult


class MessagingTransport(Protocol):
    async def start(self, on_message: Callable[[IncomingMessage], Awaitable[None]]) -> None: ...

    async def stop(self) -> None: ...

    async def send_message(self, chat_id: str, text: str, **kwargs: Any) -> MessageResult: ...

    async def send_stream(self, chat_id: str, text_stream: AsyncIterator[str], **kwargs: Any) -> MessageResult: ...

    async def register_commands(self, commands: list[BotCommand]) -> None: ...
