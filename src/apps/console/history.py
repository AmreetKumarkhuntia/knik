"""Conversation history management for AI chat applications."""

from datetime import datetime
from typing import Any


try:
    from langchain_core.messages import AIMessage, HumanMessage

    LANGCHAIN_AVAILABLE = True
except ImportError:
    AIMessage = None
    HumanMessage = None
    LANGCHAIN_AVAILABLE = False


class ConversationHistory:
    """Manages conversation history with support for both text and LangChain message formats."""

    def __init__(self, max_size: int = 50):
        self.max_size = max_size
        self.entries: list[dict[str, Any]] = []

    def add_entry(self, user_input: str, ai_response: str):
        """Add conversation turn to history."""
        entry = {"timestamp": datetime.now(), "user": user_input, "assistant": ai_response}
        self.entries.append(entry)

        if len(self.entries) > self.max_size:
            self.entries = self.entries[-self.max_size :]

    def get_context(self, last_n: int = 5) -> str:
        """Get conversation history as formatted text string."""
        if not self.entries:
            return ""

        context_entries = self.entries[-last_n:]
        context_parts = []

        for entry in context_entries:
            context_parts.append(f"User: {entry['user']}")
            context_parts.append(f"Assistant: {entry['assistant']}")

        return "\n".join(context_parts)

    def get_messages(self, last_n: int = 5) -> list:
        """Get conversation history as LangChain message objects (HumanMessage/AIMessage)."""
        if not self.entries or not LANGCHAIN_AVAILABLE:
            return []

        context_entries = self.entries[-last_n:]
        messages = []

        for entry in context_entries:
            messages.append(HumanMessage(content=entry["user"]))
            messages.append(AIMessage(content=entry["assistant"]))

        return messages

    def get_all_entries(self) -> list[dict[str, Any]]:
        return self.entries.copy()

    def clear(self):
        self.entries.clear()
