"""Request model for the chat and chat-streaming endpoints."""

from pydantic import BaseModel


class ChatRequest(BaseModel):
    """Request body for both chat endpoints: the unified (text + TTS) one and the SSE streaming one."""

    message: str
    conversation_id: str | None = None
