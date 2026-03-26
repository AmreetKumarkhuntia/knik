"""
Messaging client module for integrating with external messaging platforms.

Provides a unified async interface with dynamic provider loading.
Use MessagingClient.list_available_providers() to see all registered providers.
"""

from .client import MessagingClient
from .models import IncomingMessage, MessageResult
from .providers import BaseMessagingProvider, MockMessagingProvider, TelegramProvider
from .registry import MessagingProviderRegistry


__all__ = [
    "MessagingClient",
    "MessagingProviderRegistry",
    "BaseMessagingProvider",
    "TelegramProvider",
    "MockMessagingProvider",
    "IncomingMessage",
    "MessageResult",
]
