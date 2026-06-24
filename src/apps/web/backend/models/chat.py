"""Request models for the chat and chat-streaming endpoints."""

from pydantic import BaseModel


class SimpleChatRequest(BaseModel):
    """Request body for the unified (text + TTS) chat endpoint."""

    message: str
    conversation_id: str | None = None


class StreamChatRequest(BaseModel):
    """Request body for the SSE streaming chat endpoint."""

    message: str
    conversation_id: str | None = None
