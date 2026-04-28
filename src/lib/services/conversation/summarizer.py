"""Context compaction for conversations approaching model context limits.

When a conversation's context usage reaches the configured threshold percentage
of the model's context window, compaction is triggered.  All messages are
summarised into a single summary message that becomes the new starting point
for the LLM context.  Old messages are kept in the DB for audit but excluded
from future LLM calls.

The compactor is blocking (not background) to prevent race conditions and
uses a circuit breaker to stop after N consecutive failures.

Design based on proven approaches from OpenCode and Claude Code.
"""

from __future__ import annotations

import asyncio
import uuid
from typing import TYPE_CHECKING, Any

from lib.core.config import Config
from lib.utils import printer

from ..ai_client.token_utils import count_message_tokens, get_context_window
from .db_client import ConversationDB


if TYPE_CHECKING:
    from lib.services.ai_client.client import AIClient


_COMPACT_SYSTEM_PROMPT = """You are summarizing a conversation for context compaction.
Produce a structured summary using EXACTLY these markdown sections:

## Goal
- Single-sentence description of what the user is trying to accomplish.

## Constraints & Preferences
- Any user-stated constraints, preferences, or style requirements. Write "(none)" if none.

## Progress
### Done
- Bullet points of completed tasks and key findings.

### In Progress
- What is currently being worked on.

### Blocked
- Any blockers or unresolved issues. Write "(none)" if none.

## Key Decisions
- Important technical decisions made and why.

## Tool Activity
- Brief recap of major tool calls (file edits, searches, shell commands) and their outcomes.

## Next Steps
- What should happen next to continue the work.

Rules:
- Be detailed but concise. Preserve specific file paths, function names, error messages.
- Include verbatim any user requests to prevent goal drift.
- Summarize tool outputs briefly — focus on outcomes, not raw content.
- If the conversation was in a non-English language, write the summary in that language."""

_COMPACT_USER_PROMPT = (
    "Summarize the conversation above using the structured format specified. "
    "Preserve all important details needed to continue this work seamlessly."
)


_TOOL_RESULT_MAX_CHARS = 500


def _format_messages_for_compaction(messages: list[dict[str, Any]]) -> str:
    lines: list[str] = []
    for msg in messages:
        role = msg.get("role", "unknown").capitalize()
        content = msg.get("content") or ""
        if len(content) > 2000:
            content = content[:2000] + "... [truncated]"
        lines.append(f"{role}: {content}")

        tool_calls = msg.get("metadata", {}).get("tool_calls")
        if tool_calls:
            for tc in tool_calls:
                tc_name = tc.get("tool_name", "unknown")
                tc_result = str(tc.get("tool_result", ""))
                if len(tc_result) > _TOOL_RESULT_MAX_CHARS:
                    tc_result = tc_result[:_TOOL_RESULT_MAX_CHARS] + "... [truncated]"
                tc_args = tc.get("tool_args", {})
                args_str = ", ".join(f"{k}={v}" for k, v in tc_args.items()) if tc_args else ""
                lines.append(f"  [Tool: {tc_name}({args_str}) -> {tc_result}]")
    return "\n".join(lines)


class ConversationCompactor:
    """Manages context compaction for a conversation.

    Usage in route/agent code::

        if ConversationCompactor.should_compact(context_tokens, model_name):
            compactor = ConversationCompactor(ai_client, model_name)
            await compactor.compact(conversation_id)
    """

    _locks: dict[str, asyncio.Lock] = {}

    def __init__(self, ai_client: AIClient, model: str):
        self._ai_client = ai_client
        self._model = model

    @classmethod
    def _get_lock(cls, conversation_id: str) -> asyncio.Lock:
        if conversation_id not in cls._locks:
            cls._locks[conversation_id] = asyncio.Lock()
        return cls._locks[conversation_id]

    @staticmethod
    def should_compact(context_tokens: int, model: str) -> bool:
        cfg = Config()
        if not cfg.compaction_enabled:
            return False
        context_window = get_context_window(model)
        threshold = cfg.compaction_threshold
        return context_tokens >= int(context_window * threshold)

    @staticmethod
    async def get_active_window(conversation_id: str) -> tuple[list[dict[str, Any]], str | None]:
        """Load the active message window for a conversation.

        If the conversation has been compacted, returns only messages from
        the summary message onwards.  Returns ``(message_dicts, summary_message_id)``.
        """
        summary_message_id, _ = await ConversationDB.get_compaction_state(conversation_id)

        if summary_message_id:
            messages = await ConversationDB.get_messages_from(conversation_id, summary_message_id)
        else:
            messages = await ConversationDB.get_messages(conversation_id)

        message_dicts = [{"role": m.role, "content": m.content, "metadata": m.metadata} for m in messages]
        return message_dicts, summary_message_id

    async def compact(self, conversation_id: str) -> bool:
        """Execute the full compaction pipeline (blocking).

        Returns True if compaction succeeded, False otherwise.
        Acquires a per-conversation lock to prevent concurrent compaction.
        """
        lock = self._get_lock(conversation_id)
        if lock.locked():
            printer.info(f"Compaction already in progress for {conversation_id}, waiting...")
        async with lock:
            return await self._do_compact(conversation_id)

    async def _do_compact(self, conversation_id: str) -> bool:
        cfg = Config()
        context_window = get_context_window(self._model)
        prompt_buffer = cfg.compaction_prompt_buffer
        circuit_breaker_limit = cfg.compaction_circuit_breaker

        _, compacted_count = await ConversationDB.get_compaction_state(conversation_id)
        if compacted_count >= circuit_breaker_limit:
            printer.warning(
                f"Circuit breaker triggered for {conversation_id}: "
                f"{compacted_count} consecutive failures. Skipping compaction."
            )
            return False

        messages = await ConversationDB.get_messages(conversation_id)
        if not messages:
            return False

        message_dicts = [{"role": m.role, "content": m.content, "metadata": m.metadata} for m in messages]

        summary = await self._run_compaction(message_dicts, context_window, prompt_buffer)
        if not summary:
            new_count = await ConversationDB.increment_compacted_count(conversation_id)
            printer.error(f"Compaction failed for {conversation_id} (consecutive failures: {new_count})")
            return False

        summary_message_id = str(uuid.uuid4())
        await ConversationDB.append_message(
            conversation_id=conversation_id,
            role="assistant",
            content=summary,
            metadata={"message_id": summary_message_id, "is_compaction_summary": True},
        )

        await ConversationDB.set_compaction_state(conversation_id, summary_message_id, 0)

        printer.info(
            f"Compaction complete for {conversation_id}: "
            f"summarised {len(message_dicts)} messages into {len(summary)} chars "
            f"(summary_message_id={summary_message_id})"
        )
        return True

    async def _run_compaction(
        self,
        message_dicts: list[dict[str, Any]],
        context_window: int,
        prompt_buffer: int,
    ) -> str | None:
        prompt = self._build_compaction_prompt(message_dicts, context_window, prompt_buffer)
        if not prompt:
            return None

        try:
            summary = await asyncio.to_thread(
                self._ai_client.chat,
                prompt=prompt,
                temperature=0.3,
            )
            summary = summary.strip() if summary else None
            if summary:
                printer.info(f"Generated compaction summary ({len(summary)} chars)")
            return summary
        except Exception as e:
            printer.error(f"Compaction LLM call failed: {e}")
            return None

    def _build_compaction_prompt(
        self,
        message_dicts: list[dict[str, Any]],
        context_window: int,
        prompt_buffer: int,
    ) -> str | None:
        """Build the compaction prompt, trimming oldest messages if it would exceed context.

        Returns None if there are no messages to summarize.
        """
        if not message_dicts:
            return None

        system_msg = {"role": "system", "content": _COMPACT_SYSTEM_PROMPT}
        user_msg = {"role": "user", "content": _COMPACT_USER_PROMPT}
        overhead_messages = [system_msg, user_msg]
        overhead_tokens = count_message_tokens(overhead_messages, model=self._model)

        available_for_content = context_window - prompt_buffer - overhead_tokens
        if available_for_content <= 0:
            printer.warning("Context window too small for compaction prompt.")
            return None

        messages_to_include = list(message_dicts)
        formatted = _format_messages_for_compaction(messages_to_include)
        content_tokens = count_message_tokens([{"role": "user", "content": formatted}], model=self._model)

        while content_tokens > available_for_content and len(messages_to_include) > 1:
            messages_to_include = messages_to_include[1:]
            formatted = _format_messages_for_compaction(messages_to_include)
            content_tokens = count_message_tokens([{"role": "user", "content": formatted}], model=self._model)

        if not messages_to_include:
            return None

        return f"{_COMPACT_SYSTEM_PROMPT}\n\nConversation to summarize:\n{formatted}\n\n{_COMPACT_USER_PROMPT}"
