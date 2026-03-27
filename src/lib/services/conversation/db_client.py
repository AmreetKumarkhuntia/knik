"""Data access layer for conversation history persistence.

Every public method is DB-resilient: if the database pool is not
initialised or the connection fails, the method returns a safe default
(None, empty list, 0, etc.) instead of raising.  This removes the need
for callers to pre-check ``is_available()`` before every call.
"""

import asyncio
import json
import uuid
from datetime import datetime
from typing import Any

from lib.services.postgres.db import PostgresDB
from lib.utils import printer

from .models import Conversation, ConversationMessage


_initialized = False


class ConversationDB:
    """Data access layer for conversations stored in PostgreSQL.

    All methods silently degrade when the database is unreachable so that
    callers (e.g. ``AIClient.achat``) never need to gate on availability.
    """

    # ─── Initialisation & Availability ──────────────────────────────

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
        """Check if the database is available for conversation persistence.

        Remains public for callers (like ``history.py``) that branch on
        the availability to decide presentation (e.g. *source: database*
        vs *source: memory*).  Core logic in ``AIClient`` does **not**
        need to call this — individual methods degrade gracefully.
        """
        try:
            from lib.services.postgres.db import PostgresDB

            return PostgresDB._pool is not None
        except Exception:
            return False

    # ─── Conversation CRUD ──────────────────────────────────────────

    @staticmethod
    async def create_conversation(title: str | None = None) -> str | None:
        """Create a new conversation and return its ID.

        Returns ``None`` if the database is unavailable.
        """
        try:
            await ConversationDB._ensure_initialized()
            conversation_id = str(uuid.uuid4())
            query = """
                INSERT INTO conversations (id, title, messages)
                VALUES (%s, %s, '[]'::jsonb)
            """
            await PostgresDB.execute(query, (conversation_id, title))
            printer.info(f"Created conversation: {conversation_id}")
            return conversation_id
        except Exception as e:
            printer.debug(f"DB unavailable for create_conversation: {e}")
            return None

    @staticmethod
    async def get_conversation(conversation_id: str) -> Conversation | None:
        """Retrieve a conversation by ID with all messages."""
        try:
            await ConversationDB._ensure_initialized()
            query = "SELECT * FROM conversations WHERE id = %s"
            row = await PostgresDB.fetch_one(query, (conversation_id,))
            return Conversation.from_row(row) if row else None
        except Exception as e:
            printer.debug(f"DB unavailable for get_conversation: {e}")
            return None

    @staticmethod
    async def list_conversations(limit: int = 20, offset: int = 0) -> list[Conversation]:
        """List conversations ordered by most recently updated."""
        try:
            await ConversationDB._ensure_initialized()
            query = """
                SELECT id, title, '[]'::jsonb AS messages, created_at, updated_at
                FROM conversations
                ORDER BY updated_at DESC
                LIMIT %s OFFSET %s
            """
            rows = await PostgresDB.fetch_all(query, (limit, offset))
            return [Conversation.from_row(row) for row in rows]
        except Exception as e:
            printer.debug(f"DB unavailable for list_conversations: {e}")
            return []

    @staticmethod
    async def delete_conversation(conversation_id: str) -> None:
        """Delete a conversation.  No-ops if the database is unavailable."""
        try:
            await ConversationDB._ensure_initialized()
            query = "DELETE FROM conversations WHERE id = %s"
            await PostgresDB.execute(query, (conversation_id,))
            printer.info(f"Deleted conversation: {conversation_id}")
        except Exception as e:
            printer.debug(f"DB unavailable for delete_conversation: {e}")

    @staticmethod
    async def delete_all_conversations() -> None:
        """Delete all conversations.  No-ops if the database is unavailable."""
        try:
            await ConversationDB._ensure_initialized()
            query = "DELETE FROM conversations"
            await PostgresDB.execute(query)
            printer.info("Deleted all conversations")
        except Exception as e:
            printer.debug(f"DB unavailable for delete_all_conversations: {e}")

    @staticmethod
    async def update_title(conversation_id: str, title: str) -> None:
        """Update a conversation's title.  No-ops if the database is unavailable."""
        try:
            await ConversationDB._ensure_initialized()
            query = """
                UPDATE conversations
                SET title = %s, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """
            await PostgresDB.execute(query, (title, conversation_id))
        except Exception as e:
            printer.debug(f"DB unavailable for update_title: {e}")

    @staticmethod
    async def get_message_count(conversation_id: str) -> int:
        """Get the number of messages in a conversation.  Returns 0 if DB is unavailable."""
        try:
            await ConversationDB._ensure_initialized()
            query = "SELECT jsonb_array_length(messages) FROM conversations WHERE id = %s"
            count = await PostgresDB.fetch_val(query, (conversation_id,))
            return count or 0
        except Exception as e:
            printer.debug(f"DB unavailable for get_message_count: {e}")
            return 0

    # ─── Message Operations ─────────────────────────────────────────

    @staticmethod
    async def append_message(
        conversation_id: str,
        role: str,
        content: str,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        """Append a message to a conversation's JSONB messages array.

        No-ops if the database is unavailable.
        """
        try:
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
        except Exception as e:
            printer.debug(f"DB unavailable for append_message: {e}")

    @staticmethod
    async def get_messages(
        conversation_id: str,
    ) -> list[ConversationMessage]:
        """Get all messages for a conversation.  Returns ``[]`` if DB is unavailable."""
        try:
            await ConversationDB._ensure_initialized()
            query = "SELECT messages FROM conversations WHERE id = %s"
            row = await PostgresDB.fetch_one(query, (conversation_id,))
            if not row:
                return []

            raw_messages = row.get("messages", [])
            return [ConversationMessage.from_dict(m) for m in raw_messages]
        except Exception as e:
            printer.debug(f"DB unavailable for get_messages: {e}")
            return []

    @staticmethod
    async def get_recent_messages(conversation_id: str, last_n: int = 5) -> list[ConversationMessage]:
        """Get the last N messages for a conversation (for LLM context).

        Returns ``[]`` if DB is unavailable.
        """
        try:
            await ConversationDB._ensure_initialized()
            query = "SELECT messages FROM conversations WHERE id = %s"
            row = await PostgresDB.fetch_one(query, (conversation_id,))
            if not row:
                return []

            raw_messages = row.get("messages", [])
            recent = raw_messages[-last_n:] if len(raw_messages) > last_n else raw_messages
            return [ConversationMessage.from_dict(m) for m in recent]
        except Exception as e:
            printer.debug(f"DB unavailable for get_recent_messages: {e}")
            return []

    # ─── Token Usage ──────────────────────────────────────────────

    @staticmethod
    async def get_conversation_token_usage(conversation_id: str) -> dict[str, int]:
        """Get aggregated token usage for a conversation.

        Sums up input_tokens, output_tokens, and total_tokens from all
        messages that have usage data in their metadata.

        Returns zeroed dict if DB is unavailable.
        """
        _zero = {"total_input": 0, "total_output": 0, "total": 0}
        try:
            await ConversationDB._ensure_initialized()
            query = "SELECT messages FROM conversations WHERE id = %s"
            row = await PostgresDB.fetch_one(query, (conversation_id,))
            if not row:
                return _zero

            raw_messages = row.get("messages", [])
            total_input = 0
            total_output = 0
            total = 0

            for msg in raw_messages:
                metadata = msg.get("metadata", {})
                usage = metadata.get("usage")
                if usage and isinstance(usage, dict):
                    total_input += usage.get("input_tokens", 0)
                    total_output += usage.get("output_tokens", 0)
                    total += usage.get("total_tokens", 0)

            return {"total_input": total_input, "total_output": total_output, "total": total}
        except Exception as e:
            printer.debug(f"DB unavailable for get_conversation_token_usage: {e}")
            return _zero

    @staticmethod
    async def get_total_tokens(conversation_id: str) -> int:
        """Read the cumulative token count for a conversation.  Returns 0 if DB is unavailable."""
        try:
            await ConversationDB._ensure_initialized()
            query = "SELECT total_tokens FROM conversations WHERE id = %s"
            val = await PostgresDB.fetch_val(query, (conversation_id,))
            return val or 0
        except Exception as e:
            printer.debug(f"DB unavailable for get_total_tokens: {e}")
            return 0

    @staticmethod
    async def increment_total_tokens(conversation_id: str, tokens: int) -> int:
        """Atomically add to the conversation's cumulative token count.

        Returns the new total, or 0 if DB is unavailable.
        """
        try:
            await ConversationDB._ensure_initialized()
            query = """
                UPDATE conversations
                SET total_tokens = COALESCE(total_tokens, 0) + %s
                WHERE id = %s
                RETURNING total_tokens
            """
            val = await PostgresDB.fetch_val(query, (tokens, conversation_id))
            return val or 0
        except Exception as e:
            printer.debug(f"DB unavailable for increment_total_tokens: {e}")
            return 0

    @staticmethod
    async def reset_total_tokens(conversation_id: str, tokens: int) -> None:
        """Set the conversation's cumulative token count to a specific value.

        Called after summarization compresses the context.
        No-ops if DB is unavailable.
        """
        try:
            await ConversationDB._ensure_initialized()
            query = """
                UPDATE conversations
                SET total_tokens = %s
                WHERE id = %s
            """
            await PostgresDB.execute(query, (tokens, conversation_id))
        except Exception as e:
            printer.debug(f"DB unavailable for reset_total_tokens: {e}")

    @staticmethod
    async def get_summary(conversation_id: str) -> tuple[str | None, int | None]:
        """Get the conversation summary and the message index it covers.

        Returns ``(None, None)`` if no summary exists or DB is unavailable.
        """
        try:
            await ConversationDB._ensure_initialized()
            query = "SELECT summary, summary_through_index FROM conversations WHERE id = %s"
            row = await PostgresDB.fetch_one(query, (conversation_id,))
            if not row:
                return None, None
            return row.get("summary"), row.get("summary_through_index")
        except Exception as e:
            printer.debug(f"DB unavailable for get_summary: {e}")
            return None, None

    @staticmethod
    async def update_summary(conversation_id: str, summary: str, through_index: int) -> None:
        """Store or update the conversation summary.

        No-ops if DB is unavailable.

        Args:
            conversation_id: The conversation to update.
            summary: The compressed summary text.
            through_index: The message index up to which the summary covers
                           (0-based, inclusive).
        """
        try:
            await ConversationDB._ensure_initialized()
            query = """
                UPDATE conversations
                SET summary = %s,
                    summary_through_index = %s,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """
            await PostgresDB.execute(query, (summary, through_index, conversation_id))
            printer.info(f"Updated summary for conversation {conversation_id} (through index {through_index})")
        except Exception as e:
            printer.debug(f"DB unavailable for update_summary: {e}")

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
            truncated = first_message[:200] if len(first_message) > 200 else first_message
            title_prompt = (
                f"Generate a short 3-6 word title for this conversation. "
                f"Reply with ONLY the title, nothing else.\n\n"
                f"User message: {truncated}"
            )

            title = await asyncio.to_thread(lambda: ai_client.chat(prompt=title_prompt, max_tokens=20, temperature=0.3))

            title = title.strip().strip('"').strip("'").strip()
            if not title or len(title) > 100:
                title = fallback_title

        except Exception as e:
            printer.warning(f"Title generation failed for {conversation_id}: {e}")
            title = fallback_title

        await ConversationDB.update_title(conversation_id, title)
        return title
