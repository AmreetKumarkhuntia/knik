"""Request models for the admin endpoints."""

from pydantic import BaseModel


class ApiKeyCreate(BaseModel):
    """Request body for creating an API key."""

    label: str
    scopes: list[str] | None = None


class McpToolToggle(BaseModel):
    """Request body for enabling/disabling an MCP tool group."""

    enabled: bool
