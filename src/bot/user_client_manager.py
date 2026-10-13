"""Per-user AIClient manager for the bot."""

from __future__ import annotations

import asyncio
from functools import partial
from typing import TYPE_CHECKING

from imports import AIClient, ClientSettings, ToolRegistry, build_client, create_tool_registry, printer


if TYPE_CHECKING:
    from .consent import ConsentBroker
    from .transport import MessagingTransport


class UserClientManager:
    """Each client gets its own ToolRegistry so tool state is fully isolated between users.

    get_or_create is also the CommandService's client resolver, so /model, /provider and /status act on the
    caller's own client.
    """

    def __init__(
        self,
        ai_provider: str,
        system_instruction: str | None = None,
        transport: MessagingTransport | None = None,
        loop: asyncio.AbstractEventLoop | None = None,
        consent_broker: ConsentBroker | None = None,
    ) -> None:
        self._settings = ClientSettings(provider=ai_provider, system_instruction=system_instruction)
        self._transport = transport
        self._loop = loop
        self._consent_broker = consent_broker
        self._clients: dict[str, AIClient] = {}
        self._chat_ids: dict[str, str] = {}
        self._creation_locks: dict[str, asyncio.Lock] = {}

    def set_chat_context(self, user_id: str, chat_id: str) -> None:
        self._chat_ids[user_id] = chat_id

    def get(self, user_id: str) -> AIClient | None:
        return self._clients.get(user_id)

    def cleanup_tools(self, user_id: str) -> None:
        registry = self._tool_registry(user_id)
        if registry is not None:
            registry.cleanup_tools()

    def revoke_tool_consent(self, user_id: str) -> None:
        registry = self._tool_registry(user_id)
        if registry is not None:
            registry.revoke_allowed_tools()
            printer.info(f"Revoked tool approvals for user {user_id}")

    async def get_or_create(self, user_id: str) -> AIClient:
        # A command and a chat message can both be first to need the client; one build must serve both,
        # or a /model applied to the first client would be lost when the second replaced it.
        async with self._creation_locks.setdefault(user_id, asyncio.Lock()):
            client = self._clients.get(user_id)
            if client is None:
                client = await asyncio.to_thread(self.create_new, user_id)
                self._clients[user_id] = client
                printer.info(f"Created AIClient for user {user_id}")
            return client

    def create_new(self, user_id: str) -> AIClient:
        gate = None
        if self._transport and self._loop and self._consent_broker:
            from .consent import BotConsentGate

            gate = BotConsentGate(
                user_id=user_id,
                current_chat=partial(self._chat_ids.get, user_id),
                transport=self._transport,
                loop=self._loop,
                broker=self._consent_broker,
            )
            printer.info(f"Consent gate wired for user {user_id}")
        return build_client(self._settings, tool_registry=create_tool_registry(consent_gate=gate))

    def _tool_registry(self, user_id: str) -> ToolRegistry | None:
        client = self._clients.get(user_id)
        registry = client.tool_registry if client is not None else None
        return registry if isinstance(registry, ToolRegistry) else None
