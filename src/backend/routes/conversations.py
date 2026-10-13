"""
Conversations API
CRUD operations for persisted conversation history.
"""

from fastapi import APIRouter, Depends, HTTPException

from backend.deps import get_state
from backend.models.conversations import ConversationCreate, ConversationUpdate
from backend.state import AppState
from imports import DB_ERRORS, ConversationDB


router = APIRouter()


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
    except DB_ERRORS:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/")
async def create_conversation(request: ConversationCreate | None = None):
    """Create a new empty conversation."""
    try:
        title = request.title if request else None
        conversation_id = await ConversationDB.create_conversation(title=title)
        return {"id": conversation_id, "title": title, "status": "created"}
    except DB_ERRORS:
        raise
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
    except (HTTPException, *DB_ERRORS):
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.delete("/{conversation_id}")
async def delete_conversation(conversation_id: str, state: AppState = Depends(get_state)):
    """Delete a conversation."""
    try:
        conversation = await ConversationDB.get_conversation(conversation_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        await ConversationDB.delete_conversation(conversation_id)
        state.remove_client(conversation_id)
        return {"status": "deleted", "id": conversation_id}
    except (HTTPException, *DB_ERRORS):
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
    except (HTTPException, *DB_ERRORS):
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
    except (HTTPException, *DB_ERRORS):
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
