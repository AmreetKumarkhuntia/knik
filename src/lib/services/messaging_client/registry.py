"""Provider registry for messaging client implementations."""

from __future__ import annotations

from typing import TYPE_CHECKING


if TYPE_CHECKING:
    from .providers.base_provider import BaseMessagingProvider


class MessagingProviderRegistry:
    """Registry for messaging provider implementations."""

    _providers: dict[str, type[BaseMessagingProvider]] = {}

    @classmethod
    def register(cls, name: str, provider_class: type[BaseMessagingProvider]) -> None:
        cls._providers[name.lower()] = provider_class

    @classmethod
    def get(cls, name: str) -> type[BaseMessagingProvider] | None:
        return cls._providers.get(name.lower())

    @classmethod
    def list_providers(cls) -> list[str]:
        return list(cls._providers.keys())

    @classmethod
    def is_registered(cls, name: str) -> bool:
        return name.lower() in cls._providers
