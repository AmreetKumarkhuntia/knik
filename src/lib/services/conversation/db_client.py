"""Data access layer for conversation history persistence."""

import json
import uuid
from datetime import datetime
from typing import Any

from lib.services.postgres.db import PostgresDB
from lib.utils import printer

from .models import Conversation, ConversationMessage


_initialized = False


class ConversationDB:
    """Data access layer for conversations stored in PostgreSQL."""

    @staticmethod
    async def initialize() -> None:
        """Initialize the database pool."""
        global _initialized
        if _initialized:
            return
        printer.info("Initializing ConversationDB connection pool...")
        await PostgresDB.initialize()
        _initialized = True

    @staticmethod
    async def _ensure_initialized() -> None:
        if not _initialized:
            await ConversationDB.initialize()

    @staticmethod
    async def is_available() -> bool:
        """Check if the database is available for conversation persistence."""
        try:
            from lib.services.postgres.db import PostgresDB

            return PostgresDB._pool is not None
        except Exception:
            return False

    # ─── Conversation CRUD ──────────────────────────────────────────

    @staticmethod
    async def create_conversation(title: str | None = None) -> str:
        """Create a new conversation and return its ID."""
        await ConversationDB._ensure_initialized()
        conversation_id = str(uuid.uuid4())
        query = """
            INSERT INTO conversations (id, title, messages)
            VALUES (%s, %s, '[]'::jsonb)
        """
        await PostgresDB.execute(query, (conversation_id, title))
        printer.info(f"Created conversation: {conversation_id}")
        return conversation_id

    @staticmethod
    async def get_conversation(conversation_id: str) -> Conversation | None:
        """Retrieve a conversation by ID with all messages."""
        await ConversationDB._ensure_initialized()
        query = "SELECT * FROM conversations WHERE id = %s"
        row = await PostgresDB.fetch_one(query, (conversation_id,))
        return Conversation.from_row(row) if row else None

    @staticmethod
    async def list_conversations(limit: int = 20, offset: int = 0) -> list[Conversation]:
        """List conversations ordered by most recently updated."""
        await ConversationDB._ensure_initialized()
        query = """
            SELECT id, title, '[]'::jsonb AS messages, created_at, updated_at
            FROM conversations
            ORDER BY updated_at DESC
            LIMIT %s OFFSET %s
        """
        rows = await PostgresDB.fetch_all(query, (limit, offset))
        return [Conversation.from_row(row) for row in rows]

    @staticmethod
    async def delete_conversation(conversation_id: str) -> None:
        """Delete a conversation."""
        await ConversationDB._ensure_initialized()
        query = "DELETE FROM conversations WHERE id = %s"
        await PostgresDB.execute(query, (conversation_id,))
        printer.info(f"Deleted conversation: {conversation_id}")

    @staticmethod
    async def update_title(conversation_id: str, title: str) -> None:
        """Update a conversation's title."""
        await ConversationDB._ensure_initialized()
        query = """
            UPDATE conversations
            SET title = %s, updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
        """
        await PostgresDB.execute(query, (title, conversation_id))

    @staticmethod
    async def get_message_count(conversation_id: str) -> int:
        """Get the number of messages in a conversation."""
        await ConversationDB._ensure_initialized()
        query = "SELECT jsonb_array_length(messages) FROM conversations WHERE id = %s"
        count = await PostgresDB.fetch_val(query, (conversation_id,))
        return count or 0

    # ─── Message Operations ─────────────────────────────────────────

    @staticmethod
    async def append_message(
        conversation_id: str,
        role: str,
        content: str,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        """Append a message to a conversation's JSONB messages array."""
        await ConversationDB._ensure_initialized()

        message = {
            "role": role,
            "content": content,
            "timestamp": datetime.now().isoformat(),
            "metadata": metadata or {},
        }

        query = """
            UPDATE conversations
            SET messages = messages || %s::jsonb,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
        """
        await PostgresDB.execute(query, (json.dumps([message]), conversation_id))

    @staticmethod
    async def get_messages(
        conversation_id: str,
    ) -> list[ConversationMessage]:
        """Get all messages for a conversation."""
        await ConversationDB._ensure_initialized()
        query = "SELECT messages FROM conversations WHERE id = %s"
        row = await PostgresDB.fetch_one(query, (conversation_id,))
        if not row:
            return []

        raw_messages = row.get("messages", [])
        return [ConversationMessage.from_dict(m) for m in raw_messages]

    @staticmethod
    async def get_recent_messages(conversation_id: str, last_n: int = 5) -> list[ConversationMessage]:
        """Get the last N messages for a conversation (for LLM context)."""
        await ConversationDB._ensure_initialized()
        query = "SELECT messages FROM conversations WHERE id = %s"
        row = await PostgresDB.fetch_one(query, (conversation_id,))
        if not row:
            return []

        raw_messages = row.get("messages", [])
        # Take last N messages
        recent = raw_messages[-last_n:] if len(raw_messages) > last_n else raw_messages
        return [ConversationMessage.from_dict(m) for m in recent]

    # ─── Title Generation ───────────────────────────────────────────

    @staticmethod
    async def generate_and_set_title(
        conversation_id: str,
        first_message: str,
        ai_client: Any | None = None,
    ) -> str:
        """Generate a title for a conversation using AI, with fallback.

        Attempts a lightweight AI call to generate a 3-6 word title.
        Falls back to "New Chat (date)" on any failure.
        """
        fallback_title = f"New Chat ({datetime.now().strftime('%b %d, %Y')})"

        if ai_client is None:
            await ConversationDB.update_title(conversation_id, fallback_title)
            return fallback_title

        try:
            # Truncate the message for the title prompt
            truncated = first_message[:200] if len(first_message) > 200 else first_message
            title_prompt = (
                f"Generate a short 3-6 word title for this conversation. "
                f"Reply with ONLY the title, nothing else.\n\n"
                f"User message: {truncated}"
            )

            # Use a synchronous chat call with low token limit
            import asyncio

            title = await asyncio.to_thread(lambda: ai_client.chat(prompt=title_prompt, max_tokens=20, temperature=0.3))

            # Clean up the title
            title = title.strip().strip('"').strip("'").strip()
            if not title or len(title) > 100:
                title = fallback_title

        except Exception as e:
            printer.warning(f"Title generation failed for {conversation_id}: {e}")
            title = fallback_title

        await ConversationDB.update_title(conversation_id, title)
        return title
