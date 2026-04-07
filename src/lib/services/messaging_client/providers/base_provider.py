"""Abstract base class for messaging providers."""

from abc import ABC, abstractmethod
from collections.abc import Awaitable, Callable
from typing import Any

from ..models import CommandDefinition, IncomingMessage, MessageResult


MessageCallback = Callable[[IncomingMessage], Awaitable[None]]


class BaseMessagingProvider(ABC):
    """Base class for all messaging providers (Telegram, Slack, Discord, etc.)."""

    max_message_length: int = 4096

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

    def supports_message_edit(self) -> bool:
        """Whether this provider supports editing sent messages. Override in providers that support editing."""
        return False

    async def edit_message(self, chat_id: str, message_id: str, text: str, **kwargs) -> MessageResult:
        """Edit an existing sent message. Override in providers that support editing."""
        return MessageResult(success=False, error="Message editing not supported by this provider")

    @abstractmethod
    async def register_bot_commands(self, commands: list[CommandDefinition]) -> None:
        """Register commands with the platform (e.g. Telegram command menu. Override in providers that support it."""
        pass

    def chunk_text(self, text: str) -> list[str]:
        if len(text) <= self.max_message_length:
            return [text]

        chunks: list[str] = []
        remaining = text

        while remaining:
            if len(remaining) <= self.max_message_length:
                chunks.append(remaining)
                break

            split_point = self._find_split_point(remaining, self.max_message_length)
            chunks.append(remaining[:split_point].rstrip())
            remaining = remaining[split_point:].lstrip()

        return chunks

    @staticmethod
    def _find_split_point(text: str, max_length: int) -> int:
        search_start = max(0, max_length - 500)
        newline_pos = text.rfind("\n", search_start, max_length)

        if newline_pos > search_start:
            return newline_pos + 1

        space_start = max(0, max_length - 200)
        space_pos = text.rfind(" ", space_start, max_length)

        if space_pos > space_start:
            return space_pos + 1

        return max_length
