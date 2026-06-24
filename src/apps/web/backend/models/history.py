"""Request models for the backwards-compatible history endpoints."""

from pydantic import BaseModel


class MessageAdd(BaseModel):
    """Request body for adding a message to conversation history."""

    role: str  # "user" or "assistant"
    content: str
