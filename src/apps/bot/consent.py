"""Bot consent gate — Telegram message + Future-based reply detection."""

import asyncio
from collections import deque
from concurrent.futures import Future
from typing import ClassVar

from imports import printer
from lib.services.ai_client.consent import ConsentRequest
from lib.services.messaging_client.client import MessagingClient


class PendingConsents:
    """FIFO queue of consent Futures per chat, so parallel tool calls
    don't overwrite each other."""

    _pending: ClassVar[dict[str, deque[Future[str]]]] = {}

    @classmethod
    def add(cls, chat_id: str, consent_future: Future[str]) -> None:
        cls._pending.setdefault(chat_id, deque()).append(consent_future)

    @classmethod
    def has_pending(cls, chat_id: str) -> bool:
        q = cls._pending.get(chat_id)
        return bool(q)

    @classmethod
    def resolve(cls, chat_id: str, response: str) -> bool:
        q = cls._pending.get(chat_id)
        if not q:
            return False
        consent_future = q.popleft()
        if not q:
            del cls._pending[chat_id]
        if consent_future.done():
            printer.warning(f"Consent future already done for chat {chat_id}, skipping")
            return False
        consent_future.set_result(response)
        printer.info(f"Consent resolved for chat {chat_id}: {response}")
        return True


class BotConsentGate:
    def __init__(
        self,
        chat_id: str,
        messaging_client: MessagingClient,
        loop: asyncio.AbstractEventLoop,
        provider: str,
    ) -> None:
        self._chat_id = chat_id
        self._messaging_client = messaging_client
        self._loop = loop
        self._provider = provider

    def request_sync(self, req: ConsentRequest, timeout: float = 30.0) -> str:
        args_preview = ", ".join(f"{k}={repr(v)[:60]}" for k, v in req.kwargs.items())
        text = f"Allow {req.tool_name}({args_preview})? Reply yes (y) / yes all (ya) / no"
        printer.info(f"Sending consent prompt to chat {self._chat_id} for {req.tool_name}")

        send_coro = self._messaging_client.send_message(
            chat_id=self._chat_id,
            text=text,
            provider=self._provider,
        )
        send_fut = asyncio.run_coroutine_threadsafe(send_coro, self._loop)
        try:
            send_fut.result(timeout=10.0)
        except Exception:
            printer.error(f"Failed to send consent prompt for {req.tool_name}")
            return "no"

        consent_future: Future[str] = Future()
        PendingConsents.add(self._chat_id, consent_future)
        try:
            return consent_future.result(timeout=timeout)
        except Exception:
            printer.warning(f"Consent request timed out for {req.tool_name} in chat {self._chat_id}")
            return "no"
