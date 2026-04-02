"""
Conversations API
CRUD operations for persisted conversation history.
"""

import sys
from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel


src_path = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(src_path))

from lib.services.conversation import ConversationDB
from lib.services.tool_session.manager import ToolSessionManager


router = APIRouter()


class ConversationCreate(BaseModel):
    """Request body for creating a new conversation."""

    title: str | None = None


class ConversationUpdate(BaseModel):
    """Request body for updating a conversation's title."""

    title: str


@router.get("/")
async def list_conversations(limit: int = 20, offset: int = 0):
    """List conversations ordered by most recently updated."""
    try:
        conversations = await ConversationDB.list_conversations(limit=limit, offset=offset)
        return {
            "conversations": [c.to_dict() for c in conversations],
            "count": len(conversations),
            "limit": limit,
            "offset": offset,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/")
async def create_conversation(request: ConversationCreate | None = None):
    """Create a new empty conversation."""
    try:
        title = request.title if request else None
        conversation_id = await ConversationDB.create_conversation(title=title)
        return {"id": conversation_id, "title": title, "status": "created"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/{conversation_id}")
async def get_conversation(conversation_id: str):
    """Get a conversation with all its messages."""
    try:
        conversation = await ConversationDB.get_conversation(conversation_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        return conversation.to_dict()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.delete("/{conversation_id}")
async def delete_conversation(conversation_id: str):
    """Delete a conversation."""
    try:
        conversation = await ConversationDB.get_conversation(conversation_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        await ConversationDB.delete_conversation(conversation_id)
        # Clean up any browser / tool session associated with this conversation.
        ToolSessionManager.get_instance().cleanup_session(conversation_id)
        return {"status": "deleted", "id": conversation_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.patch("/{conversation_id}")
async def update_conversation(conversation_id: str, request: ConversationUpdate):
    """Update a conversation's title."""
    try:
        conversation = await ConversationDB.get_conversation(conversation_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        await ConversationDB.update_title(conversation_id, request.title)
        return {"status": "updated", "id": conversation_id, "title": request.title}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/{conversation_id}/messages")
async def get_messages(conversation_id: str, last_n: int | None = None):
    """Get messages for a conversation, optionally limited to the last N."""
    try:
        conversation = await ConversationDB.get_conversation(conversation_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")

        if last_n:
            messages = await ConversationDB.get_recent_messages(conversation_id, last_n=last_n)
        else:
            messages = await ConversationDB.get_messages(conversation_id)

        return {
            "conversation_id": conversation_id,
            "messages": [m.to_dict() for m in messages],
            "count": len(messages),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
