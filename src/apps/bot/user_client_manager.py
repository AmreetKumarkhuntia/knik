"""Per-user AIClient manager for the bot."""

from __future__ import annotations

import asyncio
from typing import TYPE_CHECKING


if TYPE_CHECKING:
    from lib.services.ai_client.client import AIClient

from imports import AIClient, printer
from lib.mcp.index import register_all_tools
from lib.services.ai_client.registry import MCPServerRegistry


class UserClientManager:
    """Holds one AIClient per bot user_id.

    Each client gets its own MCPServerRegistry so tool state is fully
    isolated between users.
    """

    def __init__(
        self,
        provider: str,
        system_instruction: str | None = None,
    ) -> None:
        self._provider = provider
        self._system_instruction = system_instruction
        self._clients: dict[str, AIClient] = {}

    def get(self, user_id: str) -> AIClient | None:
        return self._clients.get(user_id)

    def set(self, user_id: str, client: AIClient) -> None:
        self._clients[user_id] = client

    def remove(self, user_id: str) -> None:
        self._clients.pop(user_id, None)

    def cleanup_tools(self, user_id: str) -> None:
        """Clean up all tool instances (e.g. browser sessions) for a user."""
        client = self._clients.get(user_id)
        if client is not None:
            client._mcp_registry.cleanup_tools()

    async def get_or_create(self, user_id: str) -> AIClient:
        client = self._clients.get(user_id)
        if client is not None:
            return client
        client = await asyncio.to_thread(self.create_new)
        self._clients[user_id] = client
        printer.info(f"Created AIClient for user {user_id}")
        return client

    def create_new(self) -> AIClient:
        """Build a fresh AIClient with its own MCPServerRegistry."""
        registry = MCPServerRegistry()
        register_all_tools(registry)
        return AIClient(
            provider=self._provider,
            mcp_registry=registry,
            system_instruction=self._system_instruction,
        )
