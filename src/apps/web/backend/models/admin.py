"""Request models for admin/settings endpoints."""

from pydantic import BaseModel


class SettingsUpdate(BaseModel):
    """Request body for updating AI/TTS runtime settings + persisted preferences."""

    provider: str | None = None
    model: str | None = None
    voice: str | None = None
    api_base: str | None = None
    api_key: str | None = None
    temperature: float | None = None
    max_tokens: int | None = None
    stream_responses: bool | None = None
    send_telemetry: bool | None = None
    display_name: str | None = None
    username: str | None = None


class ApiKeyCreate(BaseModel):
    """Request body for creating an API key."""

    label: str
    scopes: list[str] | None = None


class McpToolToggle(BaseModel):
    """Request body for enabling/disabling an MCP tool group."""

    enabled: bool
