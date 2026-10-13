"""Data models for the Telegram service."""

from dataclasses import dataclass, field
from typing import Any


@dataclass
class MessageResult:
    success: bool
    message_id: str | None = None
    error: str | None = None
    raw: dict[str, Any] = field(default_factory=dict)


@dataclass
class IncomingMessage:
    chat_id: str
    text: str
    message_id: str | None = None
    sender_id: str | None = None
    sender_name: str | None = None
    timestamp: float | None = None
    raw: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class BotCommand:
    """An entry in the bot's Telegram command menu."""

    name: str
    description: str
