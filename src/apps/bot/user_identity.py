"""User identity management for cross-platform conversation continuity."""

import uuid
from dataclasses import dataclass
from typing import Any

from lib.services.messaging_client.models import IncomingMessage


@dataclass
class UserIdentity:
    user_id: str
    provider: str
    sender_id: str
    conversation_id: str | None = None
    is_new: bool = False


class UserIdentityManager:
    """
    Manages cross-platform user identity resolution.

    Maps (provider, sender_id) tuples to unified user_ids, enabling
    conversation continuity across different messaging platforms.
    """

    def __init__(self) -> None:
        self._identity_map: dict[tuple[str, str], str] = {}
        self._user_conversations: dict[str, str | None] = {}
        self._user_metadata: dict[str, dict[str, Any]] = {}

    def resolve(self, incoming: IncomingMessage, provider: str) -> UserIdentity:
        """
        Resolve an incoming message to a unified user identity.

        Creates a new user_id if this (provider, sender_id) combination
        hasn't been seen before.

        Args:
            incoming: The incoming message from a provider
            provider: The provider name (e.g., 'telegram', 'whatsapp')

        Returns:
            UserIdentity with resolved user_id and conversation state

        Raises:
            ValueError: If sender_id is None
        """
        if incoming.sender_id is None:
            raise ValueError(f"IncomingMessage from {provider} has no sender_id. Cannot resolve identity.")

        key = (provider.lower(), incoming.sender_id)

        if key in self._identity_map:
            user_id = self._identity_map[key]
            return UserIdentity(
                user_id=user_id,
                provider=provider,
                sender_id=incoming.sender_id,
                conversation_id=self._user_conversations.get(user_id),
                is_new=False,
            )

        user_id = self._generate_user_id()
        self._identity_map[key] = user_id
        self._user_conversations[user_id] = None
        self._user_metadata[user_id] = {
            "first_seen_provider": provider,
            "first_seen_at": incoming.timestamp,
            "sender_name": incoming.sender_name,
        }

        return UserIdentity(
            user_id=user_id,
            provider=provider,
            sender_id=incoming.sender_id,
            conversation_id=None,
            is_new=True,
        )

    def get_conversation_id(self, user_id: str) -> str | None:
        return self._user_conversations.get(user_id)

    def set_conversation_id(self, user_id: str, conversation_id: str) -> None:
        self._user_conversations[user_id] = conversation_id

    def clear_conversation_id(self, user_id: str) -> None:
        self._user_conversations[user_id] = None

    def get_user_metadata(self, user_id: str) -> dict[str, Any]:
        return self._user_metadata.get(user_id, {})

    def get_stats(self) -> dict[str, Any]:
        provider_counts: dict[str, int] = {}
        for provider, _ in self._identity_map:
            provider_counts[provider] = provider_counts.get(provider, 0) + 1

        active_conversations = sum(1 for conv_id in self._user_conversations.values() if conv_id is not None)

        return {
            "total_identities": len(self._identity_map),
            "active_conversations": active_conversations,
            "providers": provider_counts,
        }

    def _generate_user_id(self) -> str:
        return f"usr_{uuid.uuid4().hex[:12]}"

    def link_identities(self, user_id: str, provider: str, sender_id: str) -> None:
        """
        Link an additional (provider, sender_id) to an existing user.

        Args:
            user_id: Existing unified user identifier
            provider: Provider to link
            sender_id: Sender ID on that provider

        Raises:
            ValueError: If user_id doesn't exist or key already mapped
        """
        if user_id not in self._user_conversations:
            raise ValueError(f"User {user_id} does not exist")

        key = (provider.lower(), sender_id)
        if key in self._identity_map:
            existing = self._identity_map[key]
            if existing != user_id:
                raise ValueError(f"({provider}, {sender_id}) already linked to {existing}")
            return

        self._identity_map[key] = user_id
