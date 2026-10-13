"""Request models for workflow endpoints."""

from typing import Any

from pydantic import BaseModel


class WorkflowExecuteRequest(BaseModel):
    """Request body for executing a workflow."""

    inputs: dict[str, Any] | None = None


class WorkflowCreateRequest(BaseModel):
    """Request body for creating a workflow."""

    name: str
    definition: dict[str, Any]
    description: str | None = None


class WorkflowUpdateRequest(BaseModel):
    """Request body for updating a workflow."""

    name: str
    definition: dict[str, Any]
    description: str | None = None
