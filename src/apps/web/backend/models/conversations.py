"""Request models for conversation CRUD endpoints."""

from pydantic import BaseModel


class ConversationCreate(BaseModel):
    """Request body for creating a new conversation."""

    title: str | None = None


class ConversationUpdate(BaseModel):
    """Request body for updating a conversation's title."""

    title: str
