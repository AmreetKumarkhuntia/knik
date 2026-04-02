"""Data models for the messaging client service."""

from dataclasses import dataclass, field
from typing import Any


@dataclass
class MessageResult:
    """Result of sending a message through a messaging provider."""

    success: bool
    message_id: str | None = None
    error: str | None = None
    raw: dict[str, Any] = field(default_factory=dict)


@dataclass
class IncomingMessage:
    """A message received from a messaging provider."""

    chat_id: str
    text: str
    message_id: str | None = None
    sender_id: str | None = None
    sender_name: str | None = None
    timestamp: float | None = None
    provider_name: str | None = None
    raw: dict[str, Any] = field(default_factory=dict)
