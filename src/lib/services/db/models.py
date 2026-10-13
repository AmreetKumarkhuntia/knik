"""Row models for every table: users, conversations, workflows, schedules, executions and settings."""

from dataclasses import asdict, dataclass, field
from datetime import datetime
from typing import Any


def isoformat(value: datetime | None) -> str | None:
    return value.isoformat() if value else None


@dataclass
class ConversationMessage:
    """One entry of a conversation's JSONB `messages` array."""

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
class User:
    """Someone an app tells apart from its other users (a Telegram sender); `external_id` is their id in `source`."""

    id: str
    source: str
    external_id: str
    display_name: str | None = None
    created_at: datetime | None = None
    last_seen_at: datetime | None = None

    @classmethod
    def from_row(cls, row: dict[str, Any]) -> "User":
        return cls(
            id=row["id"],
            source=row["source"],
            external_id=row["external_id"],
            display_name=row.get("display_name"),
            created_at=row.get("created_at"),
            last_seen_at=row.get("last_seen_at"),
        )


@dataclass
class Conversation:
    """`user_id` and `source` say who started it and from which app; rows from before they were recorded have neither."""

    id: str
    title: str | None
    messages: list[ConversationMessage]
    created_at: datetime | None = None
    updated_at: datetime | None = None
    summary_message_id: str | None = None
    compacted_count: int = 0
    total_tokens: int = 0
    preview: str | None = None
    message_count: int = 0
    user_id: str | None = None
    source: str | None = None

    @classmethod
    def from_row(cls, row: dict[str, Any]) -> "Conversation":
        raw_messages = row.get("messages", [])
        messages = [ConversationMessage.from_dict(m) for m in raw_messages] if raw_messages else []

        # The list query supplies preview/message_count and omits message bodies for speed;
        # full rows carry the whole messages array, so derive both from it.
        message_count = row.get("message_count")
        if message_count is None:
            message_count = len(messages)

        preview = row.get("preview")
        if preview is None and messages:
            preview = messages[-1].content

        return cls(
            id=row["id"],
            title=row.get("title"),
            messages=messages,
            created_at=row.get("created_at"),
            updated_at=row.get("updated_at"),
            summary_message_id=row.get("summary_message_id"),
            compacted_count=row.get("compacted_count") or 0,
            total_tokens=row.get("total_tokens") or 0,
            preview=preview,
            message_count=message_count,
            user_id=row.get("user_id"),
            source=row.get("source"),
        )

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "title": self.title,
            "messages": [m.to_dict() for m in self.messages],
            "created_at": isoformat(self.created_at),
            "updated_at": isoformat(self.updated_at),
            "summary_message_id": self.summary_message_id,
            "compacted_count": self.compacted_count,
            "total_tokens": self.total_tokens,
            "preview": self.preview,
            "message_count": self.message_count,
            "user_id": self.user_id,
            "source": self.source,
        }


@dataclass
class Workflow:
    """A workflow DAG; `definition` holds its nodes and connections."""

    id: str
    name: str
    definition: dict[str, Any]
    description: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    def to_dict(self) -> dict[str, Any]:
        data = asdict(self)
        data["created_at"] = isoformat(self.created_at)
        data["updated_at"] = isoformat(self.updated_at)
        return data

    @classmethod
    def from_row(cls, row: dict[str, Any]) -> "Workflow":
        return cls(
            id=row["id"],
            name=row["name"],
            description=row.get("description"),
            definition=row.get("definition") or {},
            created_at=row.get("created_at"),
            updated_at=row.get("updated_at"),
        )


@dataclass
class Schedule:
    """When to trigger a workflow: a natural-language description plus the parsed next run and recurrence."""

    id: int
    target_workflow_id: str
    enabled: bool = True
    timezone: str = "UTC"
    schedule_description: str | None = None
    next_run_at: datetime | None = None
    recurrence_seconds: int | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
    last_executed_at: datetime | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "target_workflow_id": self.target_workflow_id,
            "enabled": self.enabled,
            "timezone": self.timezone,
            "schedule_description": self.schedule_description,
            "next_run_at": isoformat(self.next_run_at),
            "recurrence_seconds": self.recurrence_seconds,
            "created_at": isoformat(self.created_at),
            "updated_at": isoformat(self.updated_at),
            "last_executed_at": isoformat(self.last_executed_at),
        }

    @classmethod
    def from_row(cls, row: dict[str, Any]) -> "Schedule":
        return cls(
            id=row["id"],
            target_workflow_id=row["target_workflow_id"],
            enabled=row.get("enabled", True),
            timezone=row.get("timezone", "UTC"),
            schedule_description=row.get("schedule_description"),
            next_run_at=row.get("next_run_at"),
            recurrence_seconds=row.get("recurrence_seconds"),
            created_at=row.get("created_at"),
            updated_at=row.get("updated_at"),
            last_executed_at=row.get("last_executed_at"),
        )


@dataclass
class ExecutionRecord:
    """One run of a workflow."""

    id: int
    workflow_id: str
    status: str
    started_at: datetime
    inputs: dict[str, Any] = field(default_factory=dict)
    outputs: dict[str, Any] = field(default_factory=dict)
    error_message: str | None = None
    completed_at: datetime | None = None
    duration_ms: int | None = None

    @classmethod
    def from_row(cls, row: dict[str, Any]) -> "ExecutionRecord":
        return cls(
            id=row["id"],
            workflow_id=row["workflow_id"],
            status=row["status"],
            inputs=row.get("inputs") or {},
            outputs=row.get("outputs") or {},
            error_message=row.get("error_message"),
            started_at=row["started_at"],
            completed_at=row.get("completed_at"),
            duration_ms=row.get("duration_ms"),
        )


@dataclass
class NodeExecutionRecord:
    """The trace of one node within a workflow run."""

    id: int
    execution_id: int
    node_id: str
    node_type: str
    status: str
    started_at: datetime
    inputs: dict[str, Any] = field(default_factory=dict)
    outputs: dict[str, Any] = field(default_factory=dict)
    error_message: str | None = None
    completed_at: datetime | None = None
    duration_ms: int | None = None

    @classmethod
    def from_row(cls, row: dict[str, Any]) -> "NodeExecutionRecord":
        return cls(
            id=row["id"],
            execution_id=row["execution_id"],
            node_id=row["node_id"],
            node_type=row["node_type"],
            status=row["status"],
            inputs=row.get("inputs") or {},
            outputs=row.get("outputs") or {},
            error_message=row.get("error_message"),
            started_at=row["started_at"],
            completed_at=row.get("completed_at"),
            duration_ms=row.get("duration_ms"),
        )


@dataclass
class AppSettings:
    """The single app_settings row: AI/voice defaults, UI toggles and profile."""

    id: str = "singleton"
    provider: str | None = None
    model: str | None = None
    voice: str | None = None
    temperature: float | None = None
    max_tokens: int | None = None
    stream_responses: bool | None = True
    send_telemetry: bool | None = False
    display_name: str | None = None
    username: str | None = None
    updated_at: datetime | None = None
    api_base: str | None = None
    api_key: str | None = None

    @classmethod
    def from_row(cls, row: dict[str, Any]) -> "AppSettings":
        return cls(
            id=row["id"],
            provider=row.get("provider"),
            model=row.get("model"),
            voice=row.get("voice"),
            temperature=row.get("temperature"),
            max_tokens=row.get("max_tokens"),
            stream_responses=row.get("stream_responses"),
            send_telemetry=row.get("send_telemetry"),
            display_name=row.get("display_name"),
            username=row.get("username"),
            updated_at=row.get("updated_at"),
            api_base=row.get("api_base"),
            api_key=row.get("api_key"),
        )

    def to_dict(self) -> dict[str, Any]:
        """The row as a plain dict in column order; `updated_at` stays a datetime, as the raw row had it."""
        return asdict(self)


@dataclass
class ApiKey:
    """An API key's public metadata; the secret is never stored, only its hash."""

    id: str
    label: str
    key_prefix: str
    scopes: list[str] = field(default_factory=list)
    created_at: datetime | None = None
    last_used_at: datetime | None = None

    @classmethod
    def from_row(cls, row: dict[str, Any]) -> "ApiKey":
        return cls(
            id=row["id"],
            label=row["label"],
            key_prefix=row["key_prefix"],
            scopes=row.get("scopes") or [],
            created_at=row.get("created_at"),
            last_used_at=row.get("last_used_at"),
        )

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "label": self.label,
            "key_prefix": self.key_prefix,
            "scopes": self.scopes,
            "created_at": isoformat(self.created_at),
            "last_used_at": isoformat(self.last_used_at),
        }


@dataclass
class CreatedApiKey:
    """A key just created; `key` is the full secret, which can be shown to the user only this once."""

    api_key: ApiKey
    key: str

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.api_key.id,
            "label": self.api_key.label,
            "key_prefix": self.api_key.key_prefix,
            "scopes": self.api_key.scopes,
            "key": self.key,
        }


@dataclass
class McpToolState:
    """An enable/disable override for a built-in tool group; a group without one is enabled."""

    tool_name: str
    enabled: bool = True
    updated_at: datetime | None = None

    @classmethod
    def from_row(cls, row: dict[str, Any]) -> "McpToolState":
        return cls(tool_name=row["tool_name"], enabled=row["enabled"], updated_at=row.get("updated_at"))

    def to_dict(self) -> dict[str, Any]:
        return {"tool_name": self.tool_name, "enabled": self.enabled, "updated_at": isoformat(self.updated_at)}
