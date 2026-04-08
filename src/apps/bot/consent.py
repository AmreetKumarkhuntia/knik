"""Bot consent gate — Telegram message + Future-based reply detection."""

import asyncio
import logging
from concurrent.futures import Future
from typing import ClassVar

from lib.services.ai_client.consent import ConsentRequest
from lib.services.messaging_client.client import MessagingClient


logger = logging.getLogger(__name__)


class PendingConsents:
    _pending: ClassVar[dict[str, Future[str]]] = {}

    @classmethod
    def add(cls, chat_id: str, consent_future: Future[str]) -> None:
        cls._pending[chat_id] = consent_future

    @classmethod
    def has_pending(cls, chat_id: str) -> bool:
        return chat_id in cls._pending

    @classmethod
    def resolve(cls, chat_id: str, response: str) -> bool:
        consent_future = cls._pending.pop(chat_id, None)
        if consent_future is None or consent_future.done():
            return False
        consent_future.set_result(response)
        logger.info("Consent resolved for chat %s: %s", chat_id, response)
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

    def request_sync(self, req: ConsentRequest, timeout: float = 30.0) -> bool:
        args_preview = ", ".join(f"{k}={repr(v)[:60]}" for k, v in req.kwargs.items())
        text = f"Allow {req.tool_name}({args_preview})? Reply yes / yes all / no"
        logger.info("Sending consent prompt to chat %s for %s", self._chat_id, req.tool_name)

        send_coro = self._messaging_client.send_message(
            chat_id=self._chat_id,
            text=text,
            provider=self._provider,
        )
        send_fut = asyncio.run_coroutine_threadsafe(send_coro, self._loop)
        try:
            send_fut.result(timeout=10.0)
        except Exception:
            logger.exception("Failed to send consent prompt for %s", req.tool_name)
            return False

        consent_future: Future[str] = Future()
        PendingConsents.add(self._chat_id, consent_future)
        try:
            result = consent_future.result(timeout=timeout)
            return result in ("yes", "yes_all")
        except Exception:
            logger.warning("Consent request timed out for %s in chat %s", req.tool_name, self._chat_id)
            PendingConsents.resolve(self._chat_id, "no")
            return False
