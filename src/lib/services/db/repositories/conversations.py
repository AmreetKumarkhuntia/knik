"""Conversations and their JSONB message history."""

import uuid
from datetime import datetime
from typing import Any

from lib.utils.printer import printer

from ..connection import PostgresDB
from ..models import Conversation, ConversationMessage
from .base import json_param, to_model, to_models


def _empty_token_usage() -> dict[str, Any]:
    return {
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


class ConversationDB:
    @staticmethod
    async def create_conversation(title: str | None = None) -> str:
        conversation_id = str(uuid.uuid4())
        await PostgresDB.execute(
            "INSERT INTO conversations (id, title, messages) VALUES (%s, %s, '[]'::jsonb)",
            (conversation_id, title),
        )
        printer.info(f"Created conversation: {conversation_id}")
        return conversation_id

    @staticmethod
    async def get_conversation(conversation_id: str) -> Conversation | None:
        row = await PostgresDB.fetch_one("SELECT * FROM conversations WHERE id = %s", (conversation_id,))
        return to_model(Conversation.from_row, row)

    @staticmethod
    async def list_conversations(limit: int = 20, offset: int = 0) -> list[Conversation]:
        """Most recently updated first, without message bodies (only a preview and the count)."""
        query = """
            SELECT
                id,
                title,
                '[]'::jsonb AS messages,
                COALESCE(jsonb_array_length(messages), 0) AS message_count,
                LEFT(messages -> -1 ->> 'content', 200) AS preview,
                created_at,
                updated_at
            FROM conversations
            ORDER BY updated_at DESC
            LIMIT %s OFFSET %s
        """
        rows = await PostgresDB.fetch_all(query, (limit, offset))
        return to_models(Conversation.from_row, rows)

    @staticmethod
    async def delete_conversation(conversation_id: str) -> bool:
        deleted = await PostgresDB.execute("DELETE FROM conversations WHERE id = %s", (conversation_id,))
        printer.info(f"Deleted conversation: {conversation_id}")
        return deleted > 0

    @staticmethod
    async def update_title(conversation_id: str, title: str) -> bool:
        updated = await PostgresDB.execute(
            "UPDATE conversations SET title = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s",
            (title, conversation_id),
        )
        return updated > 0

    @staticmethod
    async def get_message_count(conversation_id: str) -> int:
        count = await PostgresDB.fetch_val(
            "SELECT jsonb_array_length(messages) FROM conversations WHERE id = %s", (conversation_id,)
        )
        return count or 0

    @staticmethod
    async def append_message(
        conversation_id: str,
        role: str,
        content: str,
        metadata: dict[str, Any] | None = None,
    ) -> None:
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
        # Provider metadata can carry values json cannot encode; store their str() rather than fail the turn.
        await PostgresDB.execute(query, (json_param([message], default=str), conversation_id))

    @staticmethod
    async def get_messages(conversation_id: str) -> list[ConversationMessage]:
        raw_messages = await ConversationDB._raw_messages(conversation_id)
        return [ConversationMessage.from_dict(m) for m in raw_messages]

    @staticmethod
    async def get_recent_messages(conversation_id: str, last_n: int = 5) -> list[ConversationMessage]:
        raw_messages = await ConversationDB._raw_messages(conversation_id)
        recent = raw_messages[-last_n:] if len(raw_messages) > last_n else raw_messages
        return [ConversationMessage.from_dict(m) for m in recent]

    @staticmethod
    async def get_messages_from(conversation_id: str, from_message_id: str) -> list[ConversationMessage]:
        """Messages from the one whose metadata.message_id matches (inclusive); all messages if none matches."""
        raw_messages = await ConversationDB._raw_messages(conversation_id)
        start_idx = next(
            (i for i, m in enumerate(raw_messages) if m.get("metadata", {}).get("message_id") == from_message_id),
            0,
        )
        return [ConversationMessage.from_dict(m) for m in raw_messages[start_idx:]]

    @staticmethod
    async def _raw_messages(conversation_id: str) -> list[dict[str, Any]]:
        row = await PostgresDB.fetch_one("SELECT messages FROM conversations WHERE id = %s", (conversation_id,))
        if not row:
            return []
        return row.get("messages", [])

    @staticmethod
    async def get_conversation_token_usage(conversation_id: str) -> dict[str, Any]:
        """Token totals summed from assistant messages' metadata.usage, plus the conversation's own counters.

        `db_total` is the conversations.total_tokens column. `has_estimates` is True when any usage was
        estimated locally, `partial_data` when some assistant messages carry no usage (sessions that
        predate token tracking), and `had_summarization` when the conversation has been compacted.
        A missing conversation reports all zeros.
        """
        row = await PostgresDB.fetch_one(
            "SELECT messages, total_tokens, summary_message_id FROM conversations WHERE id = %s",
            (conversation_id,),
        )
        usage_totals = _empty_token_usage()
        if not row:
            return usage_totals

        assistant_msgs = 0
        assistant_msgs_with_usage = 0
        for msg in row.get("messages", []):
            if msg.get("role") != "assistant":
                continue
            assistant_msgs += 1
            usage = msg.get("metadata", {}).get("usage")
            if not usage or not isinstance(usage, dict):
                continue
            assistant_msgs_with_usage += 1
            usage_totals["total_input"] += usage.get("input_tokens", 0) + usage.get("tool_input_tokens", 0)
            usage_totals["total_output"] += usage.get("output_tokens", 0) + usage.get("tool_output_tokens", 0)
            usage_totals["total"] += usage.get("total_tokens", 0)
            if usage.get("estimated"):
                usage_totals["has_estimates"] = True
            usage_totals["total_context_tokens"] += usage.get("context_tokens", 0)
            usage_totals["last_input_tokens"] = usage.get("input_tokens", 0)

        usage_totals["db_total"] = row.get("total_tokens") or 0
        usage_totals["partial_data"] = assistant_msgs > 0 and assistant_msgs_with_usage < assistant_msgs
        usage_totals["had_summarization"] = row.get("summary_message_id") is not None
        return usage_totals

    @staticmethod
    async def get_compaction_state(conversation_id: str) -> tuple[str | None, int]:
        """(summary_message_id, compacted_count); (None, 0) when never compacted or the conversation is missing."""
        row = await PostgresDB.fetch_one(
            "SELECT summary_message_id, compacted_count FROM conversations WHERE id = %s", (conversation_id,)
        )
        if not row:
            return None, 0
        return row.get("summary_message_id"), row.get("compacted_count") or 0

    @staticmethod
    async def set_compaction_state(conversation_id: str, summary_message_id: str, compacted_count: int) -> None:
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

    @staticmethod
    async def increment_compacted_count(conversation_id: str) -> int:
        """Bump the consecutive-compaction-failure counter (the circuit breaker); returns the new value."""
        query = """
            UPDATE conversations
            SET compacted_count = COALESCE(compacted_count, 0) + 1
            WHERE id = %s
            RETURNING compacted_count
        """
        count = await PostgresDB.fetch_val(query, (conversation_id,))
        return count or 0
