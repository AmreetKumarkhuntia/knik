"""Fakes for the command tests: an AI client, an in-memory conversation store and fixed pricing.

The bot and console command tests share them so both apps are checked against the same output.
"""

from __future__ import annotations

from dataclasses import replace
from datetime import datetime

from lib.services.db.connection import DatabaseUnavailable
from lib.services.db.models import Conversation, ConversationMessage
from lib.services.db.repositories.conversations import ConversationScope


class FakeClient:
    """The slice of AIClient the command service uses."""

    def __init__(self, provider: str = "mock", model: str = "gemini-2.5-flash") -> None:
        self.provider_name = provider
        self.model = model
        self.error: Exception | None = None
        self.provider_switches: list[tuple[str, str | None]] = []

    def get_model_name(self) -> str:
        return self.model

    def get_info(self) -> dict:
        return {"provider": self.provider_name, "model": self.model}

    def set_model(self, model_name: str) -> None:
        if self.error is not None:
            raise self.error
        self.model = model_name

    def set_provider(self, provider_name: str, model_name: str | None = None) -> None:
        if self.error is not None:
            raise self.error
        self.provider_switches.append((provider_name, model_name))
        self.provider_name = provider_name

    def list_models_for_provider(self) -> list:
        return [{"name": "gemini-2.5-flash", "description": "Fast"}, {"id": "gemini-2.5-pro"}, "plain-model", 42]


class FakeProviderRegistry:
    PROVIDERS = ("gemini", "mock", "vertex")

    @classmethod
    def list_providers(cls) -> list[str]:
        return list(cls.PROVIDERS)

    @classmethod
    def is_registered(cls, name: str) -> bool:
        return name in cls.PROVIDERS


def make_conversation(n: int, title: str | None = None) -> Conversation:
    messages = [ConversationMessage(role="user", content=f"m{i}", timestamp="") for i in range(n)]
    return Conversation(
        id=f"{n}" * 8 + "-" + "abcdef"[n - 1] * 4,
        title=title,
        messages=messages,
        created_at=datetime(2026, 3, n, 8, 0),
        updated_at=datetime(2026, 3, n, 9, 30 + n),
        message_count=n,
    )


# Newest first, as ConversationDB.list_conversations returns them; #3 has no title. Legacy rows: no owner, no source.
CONVERSATIONS = [make_conversation(n, None if n == 3 else f"Topic {n}") for n in range(1, 7)]


def owned(conversations: list[Conversation], user_id: str | None, source: str | None) -> list[Conversation]:
    return [replace(c, user_id=user_id, source=source) for c in conversations]


def admits(scope: ConversationScope | None, conversation: Conversation) -> bool:
    """What ConversationDB's scope condition admits, for a conversation in memory."""
    if scope is None:
        return True
    return (
        (scope.user_id is not None and conversation.user_id == scope.user_id)
        or conversation.source in scope.sources
        or (scope.legacy and conversation.source is None and conversation.user_id is None)
    )


class FakeConversations:
    """Stands in for ConversationDB. Set `unavailable` to make every call fail like a stopped Postgres."""

    def __init__(self, conversations: list[Conversation] | None = None) -> None:
        self.conversations = list(CONVERSATIONS if conversations is None else conversations)
        self.usage: dict[str, dict] = {}
        self.unavailable = False

    def _check(self) -> None:
        if self.unavailable:
            raise DatabaseUnavailable("Postgres unavailable")

    async def list_conversations(
        self, scope: ConversationScope, limit: int = 20, offset: int = 0
    ) -> list[Conversation]:
        """Like the real listing: only the conversations in scope, and no message bodies, only their count."""
        self._check()
        in_scope = [c for c in self.conversations if admits(scope, c)]
        return [replace(c, messages=[]) for c in in_scope[offset : offset + limit]]

    async def get_conversation(
        self, conversation_id: str, scope: ConversationScope | None = None
    ) -> Conversation | None:
        self._check()
        return next((c for c in self.conversations if c.id == conversation_id and admits(scope, c)), None)

    async def get_conversation_token_usage(self, conversation_id: str) -> dict:
        self._check()
        return self.usage[conversation_id]


def fake_cost(model: str, input_tokens: int, output_tokens: int) -> float | None:
    return None if model == "unpriced" else (input_tokens + 2 * output_tokens) / 1_000_000


def fake_context_window(model: str) -> int:
    return 0 if model == "unpriced" else 100_000


def install(monkeypatch, conversations: FakeConversations) -> None:
    """Point the command service at the fakes instead of Postgres, the provider registry and the price list."""
    monkeypatch.setattr("lib.commands.service.ConversationDB", conversations)
    monkeypatch.setattr("lib.commands.service.ProviderRegistry", FakeProviderRegistry)
    monkeypatch.setattr("lib.commands.service.get_cost", fake_cost)
    monkeypatch.setattr("lib.commands.service.get_context_window", fake_context_window)
