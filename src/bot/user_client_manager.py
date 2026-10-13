"""Per-user AIClient manager for the bot."""

from __future__ import annotations

import asyncio
from typing import TYPE_CHECKING

from imports import AIClient, MCPServerRegistry, printer, register_all_tools


if TYPE_CHECKING:
    from .transport import MessagingTransport


class UserClientManager:
    """Each client gets its own MCPServerRegistry so tool state is fully isolated between users."""

    def __init__(
        self,
        ai_provider: str,
        system_instruction: str | None = None,
        transport: MessagingTransport | None = None,
        loop: asyncio.AbstractEventLoop | None = None,
    ) -> None:
        self._ai_provider = ai_provider
        self._system_instruction = system_instruction
        self._transport = transport
        self._loop = loop
        self._clients: dict[str, AIClient] = {}
        self._chat_ids: dict[str, str] = {}

    def set_chat_context(self, user_id: str, chat_id: str) -> None:
        self._chat_ids[user_id] = chat_id

    def get(self, user_id: str) -> AIClient | None:
        return self._clients.get(user_id)

    def cleanup_tools(self, user_id: str) -> None:
        client = self._clients.get(user_id)
        if client is not None:
            client._mcp_registry.cleanup_tools()

    def revoke_tool_consent(self, user_id: str) -> None:
        client = self._clients.get(user_id)
        if client is not None:
            client._mcp_registry.revoke_allowed_tools()
            printer.info(f"Revoked tool approvals for user {user_id}")

    async def get_or_create(self, user_id: str) -> AIClient:
        client = self._clients.get(user_id)
        if client is not None:
            return client
        client = await asyncio.to_thread(self.create_new, user_id)
        self._clients[user_id] = client
        printer.info(f"Created AIClient for user {user_id}")
        return client

    def create_new(self, user_id: str) -> AIClient:
        registry = MCPServerRegistry()
        register_all_tools(registry)
        if self._transport and self._loop:
            from .consent import BotConsentGate

            chat_id = self._chat_ids.get(user_id, "")
            gate = BotConsentGate(chat_id=chat_id, transport=self._transport, loop=self._loop)
            registry.set_consent_gate(gate)
            printer.info(f"Consent gate wired for user {user_id} (chat: {chat_id})")
        return AIClient(
            provider=self._ai_provider,
            mcp_registry=registry,
            system_instruction=self._system_instruction,
        )
