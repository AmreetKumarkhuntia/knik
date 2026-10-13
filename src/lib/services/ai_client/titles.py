"""Conversation titles generated from the first user message."""

import asyncio
from datetime import datetime
from typing import Any

from lib.services.db import DB_ERRORS, ConversationDB
from lib.utils.printer import printer


async def generate_and_set_title(conversation_id: str, first_message: str, ai_client: Any | None = None) -> str | None:
    """Ask the AI for a 3-6 word title and save it; "New Chat (<date>)" when there is no client or no usable reply.

    When the AI call fails no title is saved and None is returned, so the conversation stays untitled.
    Returns the title even when the database is unavailable and it could not be saved.
    """
    fallback_title = f"New Chat ({datetime.now().strftime('%b %d, %Y')})"

    if ai_client is None:
        await _save_title(conversation_id, fallback_title)
        return fallback_title

    truncated = first_message[:200] if len(first_message) > 200 else first_message
    title_prompt = (
        f"Generate a short 3-6 word title for this conversation. "
        f"Reply with ONLY the title, nothing else.\n\n"
        f"User message: {truncated}"
    )

    try:
        title = await asyncio.to_thread(lambda: ai_client.chat(prompt=title_prompt, max_tokens=20, temperature=0.3))
    except Exception as e:
        printer.warning(f"Title generation failed for {conversation_id}, leaving it untitled: {e}")
        return None

    title = (title or "").strip().strip('"').strip("'").strip()
    if not title or len(title) > 100:
        title = fallback_title

    await _save_title(conversation_id, title)
    return title


async def _save_title(conversation_id: str, title: str) -> None:
    try:
        await ConversationDB.update_title(conversation_id, title)
    except DB_ERRORS as e:
        printer.warning(f"Title not saved for {conversation_id}, database unavailable: {e}")
