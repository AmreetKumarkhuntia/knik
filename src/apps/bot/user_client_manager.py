"""Per-user AIClient manager for the bot."""

from __future__ import annotations

import asyncio

from imports import AIClient, printer
from lib.mcp.index import register_all_tools
from lib.services.ai_client.registry import MCPServerRegistry
from lib.services.messaging_client.client import MessagingClient


class UserClientManager:
    """Each client gets its own MCPServerRegistry so tool state is fully isolated between users."""

    def __init__(
        self,
        provider: str,
        system_instruction: str | None = None,
        messaging_client: MessagingClient | None = None,
        loop: asyncio.AbstractEventLoop | None = None,
    ) -> None:
        self._provider = provider
        self._system_instruction = system_instruction
        self._messaging_client = messaging_client
        self._loop = loop
        self._clients: dict[str, AIClient] = {}
        self._chat_contexts: dict[str, tuple[str, str]] = {}

    def set_chat_context(self, user_id: str, chat_id: str, messaging_provider: str) -> None:
        self._chat_contexts[user_id] = (chat_id, messaging_provider)

    def get(self, user_id: str) -> AIClient | None:
        return self._clients.get(user_id)

    def set(self, user_id: str, client: AIClient) -> None:
        self._clients[user_id] = client

    def remove(self, user_id: str) -> None:
        self._clients.pop(user_id, None)

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
        if self._messaging_client and self._loop:
            from .consent import BotConsentGate

            chat_id, messaging_provider = self._chat_contexts.get(user_id, ("", ""))
            gate = BotConsentGate(
                chat_id=chat_id,
                messaging_client=self._messaging_client,
                loop=self._loop,
                provider=messaging_provider,
            )
            registry.set_consent_gate(gate)
            printer.info(f"Consent gate wired for user {user_id} (chat: {chat_id}, provider: {messaging_provider})")
        return AIClient(
            provider=self._provider,
            mcp_registry=registry,
            system_instruction=self._system_instruction,
        )
