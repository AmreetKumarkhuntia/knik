import json
from dataclasses import asdict, dataclass, field
from datetime import datetime
from typing import Any


@dataclass
class Workflow:
    """Represents a scheduled directed acyclic graph execution."""

    id: str
    name: str
    definition: dict[str, Any]
    description: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
    last_executed_at: datetime | None = None
    updated_at: datetime | None = None
    last_executed_at: datetime | None = None

    def to_dict(self) -> dict[str, Any]:
        """Convert the workflow to a dictionary."""
        data = asdict(self)
        if self.created_at:
            data["created_at"] = self.created_at.isoformat()
        if self.updated_at:
            data["updated_at"] = self.updated_at.isoformat()
        return data

    @classmethod
    def from_row(cls, row: dict[str, Any]) -> "Workflow":
        """Instantiate a Workflow from a database row."""
        definition = row.get("definition")
        if isinstance(definition, str):
            definition = json.loads(definition)

        return cls(
            id=row["id"],
            name=row["name"],
            description=row.get("description"),
            definition=definition or {},
            created_at=row.get("created_at"),
            updated_at=row.get("updated_at"),
            last_executed_at=row.get("last_executed_at"),
        )


@dataclass
class Schedule:
    """Represents a cron schedule for a Workflow."""

    id: int
    workflow_id: str
    trigger_workflow_id: str
    enabled: bool = True
    timezone: str = "UTC"
    created_at: datetime | None = None
    updated_at: datetime | None = None
    last_executed_at: datetime | None = None

    @classmethod
    def from_row(cls, row: dict[str, Any]) -> "Schedule":
        """Instantiate a Schedule from a database row."""
        return cls(
            id=row["id"],
            workflow_id=row["workflow_id"],
            trigger_workflow_id=row["trigger_workflow_id"],
            enabled=row.get("enabled", True),
            timezone=row.get("timezone", "UTC"),
            created_at=row.get("created_at"),
            updated_at=row.get("updated_at"),
            last_executed_at=row.get("last_executed_at"),
        )


@dataclass
class ExecutionRecord:
    """Represents a historic execution run of a Workflow."""

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
        """Instantiate an ExecutionRecord from a database row."""
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
    """Represents a historic execution trace for an individual Node within a Workflow Execution."""

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
        """Instantiate a NodeExecutionRecord from a database row."""
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
