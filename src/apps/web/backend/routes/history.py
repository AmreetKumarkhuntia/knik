"""
Conversation History API
Simple history management
"""

import sys
from pathlib import Path

from fastapi import APIRouter
from pydantic import BaseModel


# Add src to path
src_path = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(src_path))

from apps.console.history import ConversationHistory


router = APIRouter()

# Global history
conversation_history = ConversationHistory()


class MessageAdd(BaseModel):
    """Add message to history"""

    role: str  # "user" or "assistant"
    content: str


@router.get("/")
async def get_history():
    """Get conversation history"""
    messages = conversation_history.get_messages()

    return {"messages": [{"role": msg.type, "content": msg.content} for msg in messages], "count": len(messages)}


@router.post("/add")
async def add_message(msg: MessageAdd):
    """Add message to history"""
    if msg.role == "user":
        conversation_history.add_user_message(msg.content)
    else:
        conversation_history.add_ai_message(msg.content)

    return {"status": "success"}


@router.post("/clear")
async def clear_history():
    """Clear all history"""
    conversation_history.clear()
    return {"status": "success", "message": "History cleared"}
