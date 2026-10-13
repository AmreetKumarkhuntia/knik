"""Maps Telegram senders to bot user ids, which Postgres keeps across restarts, and each user's active conversation."""

import asyncio
import uuid
from dataclasses import dataclass
from typing import Any

from imports import DB_ERRORS, ConversationScope, IncomingMessage, UserDB, printer


SOURCE = "telegram"


@dataclass
class UserIdentity:
    user_id: str
    sender_id: str
    conversation_id: str | None = None
    is_new: bool = False


class UserIdentityManager:
    """A sender's id comes from their users row, looked up once and then cached.

    While Postgres is unreachable a sender gets a stand-in id kept in memory, so the bot keeps answering; each later
    message looks the sender up again, and once the lookup works they move to their stored id. Nothing is saved under
    a stand-in id (a conversation needs a stored owner), so the move loses no history.
    """

    def __init__(self) -> None:
        self._identity_map: dict[str, str] = {}
        self._user_conversations: dict[str, str | None] = {}
        self._user_metadata: dict[str, dict[str, Any]] = {}
        self._session_versions: dict[str, int] = {}
        # Senders whose id is a stand-in, to be looked up again.
        self._stand_ins: set[str] = set()
        self._lookups: dict[str, asyncio.Lock] = {}
        self._warned_unavailable = False

    async def resolve(self, incoming: IncomingMessage) -> UserIdentity:
        sender_id = incoming.sender_id
        if sender_id is None:
            raise ValueError("IncomingMessage has no sender_id. Cannot resolve identity.")

        # One lookup per sender at a time, so a command and a message arriving together get the same id.
        async with self._lookups.setdefault(sender_id, asyncio.Lock()):
            known = self._identity_map.get(sender_id)
            if known is not None and sender_id not in self._stand_ins:
                return self._identity(known, sender_id, is_new=False)

            stored = await self._stored_user_id(sender_id, incoming.sender_name)
            if stored is None:
                self._stand_ins.add(sender_id)
                user_id = known or self._generate_user_id()
            else:
                self._stand_ins.discard(sender_id)
                user_id = stored

            if known is None:
                self._user_conversations[user_id] = None
                self._user_metadata[user_id] = {
                    "first_seen_at": incoming.timestamp,
                    "sender_name": incoming.sender_name,
                }
            elif known != user_id:
                printer.info(f"Sender {sender_id} moved from stand-in id {known} to stored id {user_id}")
                self._user_conversations.setdefault(user_id, None)
                self._user_metadata[user_id] = self._user_metadata.pop(known, {})
            self._identity_map[sender_id] = user_id
            return self._identity(user_id, sender_id, is_new=known is None)

    def conversation_scope(self, user_id: str) -> ConversationScope:
        """A bot user lists and resumes only the conversations they started."""
        return ConversationScope.owned_by(user_id)

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

    def _identity(self, user_id: str, sender_id: str, is_new: bool) -> UserIdentity:
        return UserIdentity(
            user_id=user_id,
            sender_id=sender_id,
            conversation_id=self._user_conversations.get(user_id),
            is_new=is_new,
        )

    async def _stored_user_id(self, sender_id: str, sender_name: str | None) -> str | None:
        """The sender's id from their users row (created on first sight), or None when Postgres cannot be used."""
        try:
            user = await UserDB.get_or_create(SOURCE, sender_id, sender_name)
        except DB_ERRORS as e:
            # Once per outage: every message from a sender with a stand-in id tries again.
            if not self._warned_unavailable:
                printer.warning(f"Bot users cannot be looked up, database unavailable; using temporary ids: {e}")
                self._warned_unavailable = True
            return None
        self._warned_unavailable = False
        return user.id

    def _bump_session_version(self, user_id: str) -> None:
        self._session_versions[user_id] = self._session_versions.get(user_id, 0) + 1

    def _generate_user_id(self) -> str:
        return f"usr_{uuid.uuid4().hex[:12]}"
