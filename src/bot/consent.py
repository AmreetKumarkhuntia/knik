"""Bot consent gate — a Telegram prompt, answered by the user's next message in that chat."""

from __future__ import annotations

import asyncio
import threading
from collections import deque
from concurrent.futures import Future
from typing import TYPE_CHECKING

from imports import ConsentRequest, format_consent_prompt, printer


if TYPE_CHECKING:
    from collections.abc import Callable

    from .transport import MessagingTransport


class ConsentBroker:
    """The consent prompts waiting for an answer, per (chat, user).

    Each key holds a FIFO queue so parallel tool calls don't overwrite each other. Only the user a prompt
    was sent for can answer it, and a prompt that times out leaves the queue, so that user's next message
    is not taken as an answer. The gates wait in tool threads while replies arrive on the event loop, hence
    the lock.
    """

    def __init__(self) -> None:
        self._pending: dict[tuple[str, str], deque[Future[str]]] = {}
        self._lock = threading.Lock()

    def add(self, chat_id: str, user_id: str) -> Future[str]:
        future: Future[str] = Future()
        with self._lock:
            self._pending.setdefault((chat_id, user_id), deque()).append(future)
        return future

    def has_pending(self, chat_id: str, user_id: str) -> bool:
        with self._lock:
            return bool(self._pending.get((chat_id, user_id)))

    def resolve(self, chat_id: str, user_id: str, response: str) -> bool:
        """Answers the oldest prompt for this user in this chat; False when none is waiting."""
        key = (chat_id, user_id)
        with self._lock:
            queue = self._pending.get(key)
            if not queue:
                return False
            future = queue.popleft()
            if not queue:
                del self._pending[key]
            future.set_result(response)
        printer.info(f"Consent resolved for chat {chat_id} (user {user_id}): {response}")
        return True

    def withdraw(self, chat_id: str, user_id: str, future: Future[str]) -> bool:
        """Drops a prompt nobody answered in time; False when an answer got to it first."""
        key = (chat_id, user_id)
        with self._lock:
            queue = self._pending.get(key)
            if not queue or future not in queue:
                return False
            queue.remove(future)
            if not queue:
                del self._pending[key]
            return True


class BotConsentGate:
    """Asks one user for consent in the chat they last wrote from (looked up per prompt, not fixed at creation)."""

    def __init__(
        self,
        user_id: str,
        current_chat: Callable[[], str | None],
        transport: MessagingTransport,
        loop: asyncio.AbstractEventLoop,
        broker: ConsentBroker,
    ) -> None:
        self._user_id = user_id
        self._current_chat = current_chat
        self._transport = transport
        self._loop = loop
        self._broker = broker

    def request_sync(self, req: ConsentRequest, timeout: float = 30.0) -> str:
        chat_id = self._current_chat()
        if not chat_id:
            printer.error(f"No chat to ask user {self._user_id} for consent to {req.tool_name}")
            return "no"

        text = format_consent_prompt(req)
        printer.info(f"Sending consent prompt to chat {chat_id} for {req.tool_name}")

        send_coro = self._transport.send_message(chat_id=chat_id, text=text)
        send_fut = asyncio.run_coroutine_threadsafe(send_coro, self._loop)
        try:
            send_fut.result(timeout=20.0)
        except Exception:
            printer.error(f"Failed to send consent prompt for {req.tool_name}")
            return "no"

        consent_future = self._broker.add(chat_id, self._user_id)
        try:
            return consent_future.result(timeout=timeout)
        except TimeoutError:
            if self._broker.withdraw(chat_id, self._user_id, consent_future):
                printer.warning(f"Consent request timed out for {req.tool_name} in chat {chat_id}")
                return "no"
            # The reply landed between the timeout and the withdrawal; it is set by now.
            return consent_future.result()
