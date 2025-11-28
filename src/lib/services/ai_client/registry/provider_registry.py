"""Provider registry for dynamic AI provider discovery and management."""

from typing import Dict, Type, Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from ..providers.base_provider import BaseAIProvider


class ProviderRegistry:
    """Registry for AI provider implementations."""
    
    _providers: Dict[str, Type['BaseAIProvider']] = {}
    
    @classmethod
    def register(cls, name: str, provider_class: Type['BaseAIProvider']) -> None:
        cls._providers[name.lower()] = provider_class
    
    @classmethod
    def get(cls, name: str) -> Optional[Type['BaseAIProvider']]:
        return cls._providers.get(name.lower())
    
    @classmethod
    def list_providers(cls) -> list[str]:
        return list(cls._providers.keys())
    
    @classmethod
    def is_registered(cls, name: str) -> bool:
        return name.lower() in cls._providers
