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
                SET messages = COALESCE(messages, '[]'::jsonb) || %s::jsonb,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """
            await PostgresDB.execute(query, (json.dumps([message], default=str), conversation_id))
        except Exception as e:
            printer.error(f"append_message failed for {conversation_id}: {e}")

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

    @staticmethod
    async def get_conversation_token_usage(conversation_id: str) -> dict:
        """Get aggregated token usage for a conversation.

        Fetches messages, total_tokens (DB column), and summary_through_index
        in a single query so callers don't need extra round-trips.

        Returns:
            total_input      – sum of input_tokens across messages with usage metadata
            total_output     – sum of output_tokens across messages with usage metadata
            total            – sum of total_tokens across messages with usage metadata
            db_total         – authoritative running total from the conversations.total_tokens
                               column (incremented every turn, reset after summarization to
                               compressed_context + summarization_call_cost)
            has_estimates    – True if any message usage was tiktoken-estimated
            partial_data     – True if some assistant messages are missing usage metadata
                               (typical for sessions started before token tracking was added)
            had_summarization – True if the conversation has been summarized at least once
        """
        _zero = {
            "total_input": 0,
            "total_output": 0,
            "total": 0,
            "db_total": 0,
            "has_estimates": False,
            "partial_data": False,
            "had_summarization": False,
            "total_context_tokens": 0,
            "last_input_tokens": 0,
        }
        try:
            await ConversationDB._ensure_initialized()
            query = """
                SELECT messages, total_tokens, summary_message_id
                FROM conversations
                WHERE id = %s
            """
            row = await PostgresDB.fetch_one(query, (conversation_id,))
            if not row:
                return _zero

            raw_messages = row.get("messages", [])
            db_total = row.get("total_tokens") or 0
            had_summarization = row.get("summary_message_id") is not None

            total_input = 0
            total_output = 0
            total = 0
            has_estimates = False
            assistant_msgs = 0
            assistant_msgs_with_usage = 0
            total_context_tokens = 0
            last_input_tokens = 0

            for msg in raw_messages:
                if msg.get("role") == "assistant":
                    assistant_msgs += 1
                    metadata = msg.get("metadata", {})
                    usage = metadata.get("usage")
                    if usage and isinstance(usage, dict):
                        assistant_msgs_with_usage += 1
                        total_input += usage.get("input_tokens", 0) + usage.get("tool_input_tokens", 0)
                        total_output += usage.get("output_tokens", 0) + usage.get("tool_output_tokens", 0)
                        total += usage.get("total_tokens", 0)
                        if usage.get("estimated"):
                            has_estimates = True
                        total_context_tokens += usage.get("context_tokens", 0)
                        last_input_tokens = usage.get("input_tokens", 0)

            partial_data = assistant_msgs > 0 and assistant_msgs_with_usage < assistant_msgs

            return {
                "total_input": total_input,
                "total_output": total_output,
                "total": total,
                "db_total": db_total,
                "has_estimates": has_estimates,
                "partial_data": partial_data,
                "had_summarization": had_summarization,
                "total_context_tokens": total_context_tokens,
                "last_input_tokens": last_input_tokens,
            }
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
    async def get_compaction_state(conversation_id: str) -> tuple[str | None, int]:
        """Get the compaction state for a conversation.

        Returns ``(summary_message_id, compacted_count)``.
        ``(None, 0)`` if no compaction has occurred or DB is unavailable.
        """
        try:
            await ConversationDB._ensure_initialized()
            query = "SELECT summary_message_id, compacted_count FROM conversations WHERE id = %s"
            row = await PostgresDB.fetch_one(query, (conversation_id,))
            if not row:
                return None, 0
            return row.get("summary_message_id"), row.get("compacted_count") or 0
        except Exception as e:
            printer.debug(f"DB unavailable for get_compaction_state: {e}")
            return None, 0

    @staticmethod
    async def set_compaction_state(
        conversation_id: str,
        summary_message_id: str,
        compacted_count: int,
    ) -> None:
        """Set the compaction pointer and failure counter.

        No-ops if DB is unavailable.
        """
        try:
            await ConversationDB._ensure_initialized()
            query = """
                UPDATE conversations
                SET summary_message_id = %s,
                    compacted_count = %s,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """
            await PostgresDB.execute(query, (summary_message_id, compacted_count, conversation_id))
            printer.info(
                f"Compaction state updated for {conversation_id} (summary_msg={summary_message_id}, count={compacted_count})"
            )
        except Exception as e:
            printer.debug(f"DB unavailable for set_compaction_state: {e}")

    @staticmethod
    async def increment_compacted_count(conversation_id: str) -> int:
        """Atomically increment the compacted_count (circuit breaker tracker).

        Returns the new count, or 0 if DB is unavailable.
        """
        try:
            await ConversationDB._ensure_initialized()
            query = """
                UPDATE conversations
                SET compacted_count = COALESCE(compacted_count, 0) + 1
                WHERE id = %s
                RETURNING compacted_count
            """
            val = await PostgresDB.fetch_val(query, (conversation_id,))
            return val or 0
        except Exception as e:
            printer.debug(f"DB unavailable for increment_compacted_count: {e}")
            return 0

    @staticmethod
    async def get_messages_from(conversation_id: str, from_message_id: str) -> list[ConversationMessage]:
        """Get messages starting from (and including) a specific message.

        Finds the message with the given ID in the JSONB array and returns
        it and all subsequent messages.  Returns ``[]`` if DB is unavailable
        or the message is not found.
        """
        try:
            await ConversationDB._ensure_initialized()
            query = "SELECT messages FROM conversations WHERE id = %s"
            row = await PostgresDB.fetch_one(query, (conversation_id,))
            if not row:
                return []

            raw_messages = row.get("messages", [])
            start_idx = None
            for i, m in enumerate(raw_messages):
                msg_meta = m.get("metadata", {})
                if msg_meta.get("message_id") == from_message_id:
                    start_idx = i
                    break

            if start_idx is None:
                return [ConversationMessage.from_dict(m) for m in raw_messages]

            return [ConversationMessage.from_dict(m) for m in raw_messages[start_idx:]]
        except Exception as e:
            printer.debug(f"DB unavailable for get_messages_from: {e}")
            return []

    @staticmethod
    async def get_context_usage(conversation_id: str, from_message_id: str | None = None) -> int:
        """Calculate context token usage from API-reported input_tokens.

        Sums ``metadata.usage.input_tokens`` across messages in the active
        window (from ``from_message_id`` onwards, or all if None).
        Falls back to 0 if no API usage data is available.
        """
        try:
            await ConversationDB._ensure_initialized()
            query = "SELECT messages FROM conversations WHERE id = %s"
            row = await PostgresDB.fetch_one(query, (conversation_id,))
            if not row:
                return 0

            raw_messages = row.get("messages", [])
            if from_message_id:
                start_idx = None
                for i, m in enumerate(raw_messages):
                    if m.get("metadata", {}).get("message_id") == from_message_id:
                        start_idx = i
                        break
                if start_idx is not None:
                    raw_messages = raw_messages[start_idx:]

            total = 0
            for m in raw_messages:
                usage = m.get("metadata", {}).get("usage", {})
                input_tokens = usage.get("input_tokens", 0)
                if input_tokens:
                    total += input_tokens
            return total
        except Exception as e:
            printer.debug(f"DB unavailable for get_context_usage: {e}")
            return 0

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
