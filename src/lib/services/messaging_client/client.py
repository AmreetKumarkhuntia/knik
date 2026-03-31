"""Async messaging client facade supporting multiple providers simultaneously."""

import asyncio
from typing import Any

from ...utils import printer
from .models import MessageResult
from .providers.base_provider import BaseMessagingProvider, MessageCallback
from .registry import MessagingProviderRegistry


class MessagingClient:
    """Unified async messaging client that can manage multiple providers at once."""

    def __init__(self, providers: str | list[str] = "telegram", **provider_kwargs):
        if isinstance(providers, str):
            providers = [providers]

        self._providers: dict[str, BaseMessagingProvider] = {}

        for name in providers:
            name_lower = name.lower()
            provider_class = MessagingProviderRegistry.get(name_lower)
            if provider_class is None:
                available = MessagingProviderRegistry.list_providers()
                raise ValueError(
                    f"Unknown messaging provider: '{name}'. "
                    f"Available: {', '.join(available) if available else 'none (no providers registered)'}"
                )

            instance = provider_class(**provider_kwargs)
            self._providers[name_lower] = instance

            if not instance.is_configured():
                printer.warning(f"MessagingClient: '{name}' provider is not configured.")

    async def send_message(self, chat_id: str, text: str, provider: str | None = None, **kwargs) -> MessageResult:
        """Send a text message. Provider is required when multiple are loaded."""
        target = self._resolve_provider(provider)
        if not target.is_configured():
            return MessageResult(success=False, error=f"Provider '{provider}' is not configured")
        return await target.send_message(chat_id, text, **kwargs)

    def supports_message_edit(self, provider: str | None = None) -> bool:
        """Check if the resolved provider supports editing sent messages."""
        target = self._resolve_provider(provider)
        return target.supports_message_edit()

    async def edit_message(
        self, chat_id: str, message_id: str, text: str, provider: str | None = None, **kwargs
    ) -> MessageResult:
        """Edit an existing sent message via the resolved provider."""
        target = self._resolve_provider(provider)
        if not target.is_configured():
            return MessageResult(success=False, error=f"Provider '{provider}' is not configured")
        return await target.edit_message(chat_id, message_id, text, **kwargs)

    async def start(self, on_message: MessageCallback) -> None:
        """Start all configured providers concurrently."""
        configured = {name: p for name, p in self._providers.items() if p.is_configured()}
        if not configured:
            raise RuntimeError("Cannot start: no providers are configured")

        await asyncio.gather(*(p.start(on_message) for p in configured.values()))

    async def stop(self) -> None:
        """Gracefully shut down all running providers."""
        await asyncio.gather(*(p.stop() for p in self._providers.values()))

    def is_configured(self) -> bool:
        """Return True if at least one provider is configured."""
        return any(p.is_configured() for p in self._providers.values())

    def get_provider(self, name: str) -> BaseMessagingProvider:
        """Retrieve a loaded provider by name."""
        name_lower = name.lower()
        if name_lower not in self._providers:
            raise ValueError(f"Provider '{name}' not loaded. Loaded providers: {', '.join(self._providers.keys())}")
        return self._providers[name_lower]

    def get_info(self) -> dict[str, Any]:
        """Return status info for all loaded providers."""
        return {
            "providers": {name: p.get_info() for name, p in self._providers.items()},
            "configured_count": sum(1 for p in self._providers.values() if p.is_configured()),
        }

    @staticmethod
    def list_available_providers() -> list[str]:
        """List all registered provider names."""
        return MessagingProviderRegistry.list_providers()

    def _resolve_provider(self, provider: str | None) -> BaseMessagingProvider:
        if provider:
            return self.get_provider(provider)

        if len(self._providers) == 1:
            return next(iter(self._providers.values()))

        raise ValueError(
            "Multiple providers loaded. Specify which one to use via the 'provider' parameter. "
            f"Loaded: {', '.join(self._providers.keys())}"
        )
