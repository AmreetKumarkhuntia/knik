"""Single-user identity for the console app."""

from __future__ import annotations

from .commands.registry import CONSOLE_USER_ID


class ConsoleIdentity:
    """Satisfies UserIdentityProtocol for the single-user console context."""

    def __init__(self) -> None:
        self._conversation_id: str | None = None

    def get_conversation_id(self, user_id: str) -> str | None:
        return self._conversation_id

    def set_conversation_id(self, user_id: str, conversation_id: str) -> None:
        self._conversation_id = conversation_id

    def clear_conversation_id(self, user_id: str) -> None:
        self._conversation_id = None

    @property
    def user_id(self) -> str:
        return CONSOLE_USER_ID
