"""Data models for command operations."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Protocol, runtime_checkable


@dataclass
class CommandResult:
    success: bool
    message: str
    data: dict[str, Any] = field(default_factory=dict)


@dataclass
class SessionInfo:
    conversation_id: str
    title: str | None
    created_at: datetime | None = None
    updated_at: datetime | None = None
    message_count: int = 0


@dataclass
class StatusInfo:
    provider: str
    model: str
    conversation_id: str | None = None
    user_id: str | None = None
    total_tokens: int = 0
    input_tokens: int = 0
    output_tokens: int = 0
    has_estimates: bool = False
    has_partial_data: bool = False
    had_summarization: bool = False
    estimated_cost_usd: float | None = None


@dataclass
class ModelInfo:
    name: str
    description: str = ""


@dataclass
class CommandDefinition:
    name: str
    description: str


@runtime_checkable
class UserIdentityProtocol(Protocol):
    def get_conversation_id(self, user_id: str) -> str | None: ...
    def set_conversation_id(self, user_id: str, conversation_id: str) -> None: ...
    def clear_conversation_id(self, user_id: str) -> None: ...
