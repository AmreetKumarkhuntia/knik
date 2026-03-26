"""Abstract base class for messaging providers."""

from abc import ABC, abstractmethod
from collections.abc import Awaitable, Callable
from typing import Any

from ..models import IncomingMessage, MessageResult


MessageCallback = Callable[[IncomingMessage], Awaitable[None]]


class BaseMessagingProvider(ABC):
    """Base class for all messaging providers (Telegram, Slack, Discord, etc.)."""

    @classmethod
    @abstractmethod
    def get_provider_name(cls) -> str: ...

    @abstractmethod
    async def send_message(self, chat_id: str, text: str, **kwargs) -> MessageResult: ...

    @abstractmethod
    async def start(self, on_message: MessageCallback) -> None: ...

    @abstractmethod
    async def stop(self) -> None: ...

    @abstractmethod
    def is_configured(self) -> bool: ...

    @abstractmethod
    def get_info(self) -> dict[str, Any]: ...
