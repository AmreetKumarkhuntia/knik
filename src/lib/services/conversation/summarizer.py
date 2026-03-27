"""Context summarization for conversations approaching model context limits.

When a conversation's cumulative token count (tracked in the DB) reaches
the configured threshold percentage of the model's context window, the
routes trigger summarization. This module provides the check and the
summarization logic.

The summarizer is model-agnostic and works with whichever provider/model
the conversation is using.
"""

from __future__ import annotations

import asyncio
from typing import TYPE_CHECKING, Any

from langchain_core.messages import SystemMessage

from lib.core.config import Config
from lib.utils import printer

from ..ai_client.token_utils import count_message_tokens, get_context_window
from .db_client import ConversationDB


if TYPE_CHECKING:
    from lib.services.ai_client.client import AIClient


_SUMMARIZE_PROMPT = """You are summarizing a conversation between a user and an AI assistant.
Produce a concise summary that preserves:
- Key facts and information discussed
- Decisions made and preferences expressed
- Technical details, code snippets, and specific values mentioned
- The current topic and direction of conversation
- Any outstanding questions or tasks

{previous_summary_section}
Conversation to summarize:
{messages}

Summary:"""


def _format_previous_summary(existing_summary: str | None) -> str:
    if existing_summary:
        return f"Previous summary of earlier conversation:\n{existing_summary}\n"
    return ""


def _format_messages_for_prompt(messages: list[dict[str, Any]]) -> str:
    """Format message dicts into a human-readable transcript for the summarization prompt."""
    lines: list[str] = []
    for msg in messages:
        role = msg.get("role", "unknown").capitalize()
        content = msg.get("content") or ""
        if len(content) > 2000:
            content = content[:2000] + "... [truncated]"
        lines.append(f"{role}: {content}")
    return "\n".join(lines)


class ConversationSummarizer:
    """Manages context summarization for a conversation.

    Typical usage in a route::

        # Cheap gate: only fires when cumulative tokens cross the threshold
        if ConversationSummarizer.should_summarize(total_tokens, model_name):
            summarizer = ConversationSummarizer(ai_client, model_name)
            asyncio.create_task(summarizer.run(conversation_id))

        # Before every AI call: inject existing summary if one exists
        history = ConversationSummarizer.inject_summary(summary, history)
    """

    # Tracks conversation IDs currently being summarized to prevent duplicates
    _in_progress: set[str] = set()

    def __init__(
        self,
        ai_client: AIClient,
        model: str,
        *,
        keep_recent: int | None = None,
    ):
        self._ai_client = ai_client
        self._model = model
        self._keep_recent = keep_recent or Config.DEFAULT_SUMMARIZATION_KEEP_RECENT

    @staticmethod
    def should_summarize(
        total_tokens: int,
        model: str,
        threshold: float | None = None,
    ) -> bool:
        """Check whether the conversation's cumulative token count warrants summarization.

        Pure function — no DB access, no tiktoken. Just an integer comparison.
        Reads from the env-var-aware Config instance so KNIK_SUMMARIZATION_ENABLED
        is respected at runtime.
        """
        cfg = Config()
        if not cfg.summarization_enabled:
            return False
        thr = threshold or cfg.summarization_threshold
        context_window = get_context_window(model)
        budget = int(context_window * thr)
        return total_tokens >= budget

    @staticmethod
    def inject_summary(summary: str | None, history: list) -> list:
        """Prepend an existing summary as a SystemMessage to the history.

        Returns history unchanged if summary is None or empty.
        Strips any previous summary SystemMessages to avoid stacking.
        """
        if not summary:
            return history

        filtered = [
            msg
            for msg in history
            if not (
                isinstance(msg, SystemMessage)
                and hasattr(msg, "content")
                and str(msg.content).startswith("Summary of earlier conversation:")
            )
        ]

        summary_msg = SystemMessage(content=f"Summary of earlier conversation:\n{summary}")
        return [summary_msg] + filtered

    async def run(self, conversation_id: str) -> None:
        """Execute the full summarization pipeline.

        Only call this after should_summarize() returned True. Loads the
        full message history from DB, summarizes older messages, stores the
        summary, and resets the token counter to reflect the compressed context.

        Prevents duplicate runs for the same conversation via a class-level guard.
        """
        if conversation_id in self._in_progress:
            printer.debug(f"Summarization already in progress for {conversation_id}, skipping.")
            return
        self._in_progress.add(conversation_id)
        try:
            messages = await ConversationDB.get_messages(conversation_id)
            if not messages:
                return

            message_dicts = [{"role": m.role, "content": m.content} for m in messages]
            existing_summary, _ = await ConversationDB.get_summary(conversation_id)

            keep_count = self._keep_recent * 2
            if len(message_dicts) <= keep_count:
                printer.debug("Not enough messages to summarize, skipping.")
                return

            msgs_to_summarize = message_dicts[: len(message_dicts) - keep_count]
            msgs_to_keep = message_dicts[len(message_dicts) - keep_count :]

            new_summary = await self._run_summarization(existing_summary, msgs_to_summarize)
            if not new_summary:
                return

            new_through_index = max(0, len(message_dicts) - keep_count - 1)
            await ConversationDB.update_summary(conversation_id, new_summary, new_through_index)

            remaining_tokens = count_message_tokens(msgs_to_keep, model=self._model)
            summary_tokens = count_message_tokens([{"role": "system", "content": new_summary}], model=self._model)
            await ConversationDB.reset_total_tokens(conversation_id, remaining_tokens + summary_tokens)

            printer.info(
                f"Summarization complete for {conversation_id}: "
                f"compressed to {remaining_tokens + summary_tokens} tokens "
                f"(through index {new_through_index})"
            )

        except Exception as e:
            printer.error(f"Summarization failed for {conversation_id}: {e}")
        finally:
            self._in_progress.discard(conversation_id)

    async def _run_summarization(
        self,
        existing_summary: str | None,
        messages_to_summarize: list[dict[str, Any]],
    ) -> str | None:
        """Call the LLM to produce a summary."""
        prompt = _SUMMARIZE_PROMPT.format(
            previous_summary_section=_format_previous_summary(existing_summary),
            messages=_format_messages_for_prompt(messages_to_summarize),
        )

        try:
            summary = await asyncio.to_thread(
                self._ai_client.chat,
                prompt=prompt,
                max_tokens=1024,
                temperature=0.3,
            )
            summary = summary.strip() if summary else None
            if summary:
                printer.info(f"Generated summary ({len(summary)} chars)")
            return summary
        except Exception as e:
            printer.error(f"Summarization LLM call failed: {e}")
            return None
