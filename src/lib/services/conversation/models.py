"""Data models for conversation history."""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any


@dataclass
class ConversationMessage:
    """A single message within a conversation."""

    role: str
    content: str
    timestamp: str
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {
            "role": self.role,
            "content": self.content,
            "timestamp": self.timestamp,
            "metadata": self.metadata,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "ConversationMessage":
        return cls(
            role=data.get("role", "user"),
            content=data.get("content", ""),
            timestamp=data.get("timestamp", datetime.now().isoformat()),
            metadata=data.get("metadata", {}),
        )


@dataclass
class Conversation:
    """A conversation with its messages."""

    id: str
    title: str | None
    messages: list[ConversationMessage]
    created_at: datetime | None = None
    updated_at: datetime | None = None
    summary_message_id: str | None = None
    compacted_count: int = 0
    total_tokens: int = 0

    @classmethod
    def from_row(cls, row: dict[str, Any]) -> "Conversation":
        """Create a Conversation from a database row."""
        raw_messages = row.get("messages", [])
        messages = [ConversationMessage.from_dict(m) for m in raw_messages] if raw_messages else []

        return cls(
            id=row["id"],
            title=row.get("title"),
            messages=messages,
            created_at=row.get("created_at"),
            updated_at=row.get("updated_at"),
            summary_message_id=row.get("summary_message_id"),
            compacted_count=row.get("compacted_count") or 0,
            total_tokens=row.get("total_tokens") or 0,
        )

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "title": self.title,
            "messages": [m.to_dict() for m in self.messages],
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "summary_message_id": self.summary_message_id,
            "compacted_count": self.compacted_count,
            "total_tokens": self.total_tokens,
        }
