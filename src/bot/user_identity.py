"""Maps Telegram senders to bot user ids and their active conversation (in memory only)."""

import uuid
from dataclasses import dataclass
from typing import Any

from imports import IncomingMessage


@dataclass
class UserIdentity:
    user_id: str
    sender_id: str
    conversation_id: str | None = None
    is_new: bool = False


class UserIdentityManager:
    def __init__(self) -> None:
        self._identity_map: dict[str, str] = {}
        self._user_conversations: dict[str, str | None] = {}
        self._user_metadata: dict[str, dict[str, Any]] = {}
        self._session_versions: dict[str, int] = {}

    def resolve(self, incoming: IncomingMessage) -> UserIdentity:
        sender_id = incoming.sender_id
        if sender_id is None:
            raise ValueError("IncomingMessage has no sender_id. Cannot resolve identity.")

        if sender_id in self._identity_map:
            user_id = self._identity_map[sender_id]
            return UserIdentity(
                user_id=user_id,
                sender_id=sender_id,
                conversation_id=self._user_conversations.get(user_id),
                is_new=False,
            )

        user_id = self._generate_user_id()
        self._identity_map[sender_id] = user_id
        self._user_conversations[user_id] = None
        self._user_metadata[user_id] = {
            "first_seen_at": incoming.timestamp,
            "sender_name": incoming.sender_name,
        }

        return UserIdentity(user_id=user_id, sender_id=sender_id, conversation_id=None, is_new=True)

    def get_conversation_id(self, user_id: str) -> str | None:
        return self._user_conversations.get(user_id)

    def set_conversation_id(self, user_id: str, conversation_id: str) -> None:
        self._user_conversations[user_id] = conversation_id
        self._bump_session_version(user_id)

    def clear_conversation_id(self, user_id: str) -> None:
        self._user_conversations[user_id] = None
        self._bump_session_version(user_id)

    def session_version(self, user_id: str) -> int:
        """Changes whenever the user's conversation is set or cleared, even to the value it already had.

        A reply compares it before and after to tell whether a /new or /resume came in while it ran.
        """
        return self._session_versions.get(user_id, 0)

    def get_user_metadata(self, user_id: str) -> dict[str, Any]:
        return self._user_metadata.get(user_id, {})

    def get_user_id_for_sender(self, sender_id: str | None) -> str | None:
        if sender_id is None:
            return None
        return self._identity_map.get(sender_id)

    def get_conversation_id_for_sender(self, sender_id: str | None) -> str | None:
        user_id = self.get_user_id_for_sender(sender_id)
        if user_id is None:
            return None
        return self._user_conversations.get(user_id)

    def _bump_session_version(self, user_id: str) -> None:
        self._session_versions[user_id] = self._session_versions.get(user_id, 0) + 1

    def _generate_user_id(self) -> str:
        return f"usr_{uuid.uuid4().hex[:12]}"
