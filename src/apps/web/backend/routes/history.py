"""
Conversation History API
Backwards-compatible history management.
Delegates to ConversationDB for persistence when available,
falls back to in-memory ConversationHistory.
"""

import sys
from pathlib import Path

from fastapi import APIRouter
from pydantic import BaseModel


src_path = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(src_path))

from apps.console.history import ConversationHistory
from lib.services.conversation import ConversationDB


router = APIRouter()

conversation_history = ConversationHistory()


class MessageAdd(BaseModel):
    """Request body for adding a message to conversation history."""

    role: str  # "user" or "assistant"
    content: str


async def _is_db_available() -> bool:
    """Check if the database is available."""
    try:
        from lib.services.postgres.db import PostgresDB

        return PostgresDB._pool is not None
    except Exception:
        return False


@router.get("/")
async def get_history():
    """Get conversation history.

    If DB is available, returns the most recent conversations.
    Otherwise falls back to the in-memory history.
    """
    if await _is_db_available():
        try:
            conversations = await ConversationDB.list_conversations(limit=10)
            return {
                "conversations": [c.to_dict() for c in conversations],
                "count": len(conversations),
                "source": "database",
            }
        except Exception:
            pass

    # Fallback: in-memory
    messages = conversation_history.get_messages()
    return {
        "messages": [{"role": msg.type, "content": msg.content} for msg in messages],
        "count": len(messages),
        "source": "memory",
    }


@router.post("/add")
async def add_message(msg: MessageAdd):
    """Add message to history (backwards-compatible)."""
    if msg.role == "user":
        conversation_history._pending_user = msg.content
    else:
        user_content = getattr(conversation_history, "_pending_user", "")
        conversation_history.add_entry(user_content, msg.content)
        conversation_history._pending_user = ""

    return {"status": "success"}


@router.post("/clear")
async def clear_history():
    """Clear all history (in-memory and database)."""
    conversation_history.clear()
    await ConversationDB.delete_all_conversations()
    return {"status": "success", "message": "History cleared"}
