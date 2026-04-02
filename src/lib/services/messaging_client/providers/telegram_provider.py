"""Telegram messaging provider using python-telegram-bot."""

from __future__ import annotations

from typing import Any

from telegram import Bot, Update
from telegram.ext import Application, MessageHandler, filters

from ....core.config import Config
from ....utils import printer
from ..models import IncomingMessage, MessageResult
from ..registry import MessagingProviderRegistry
from .base_provider import BaseMessagingProvider, MessageCallback


class TelegramProvider(BaseMessagingProvider):
    """Telegram bot provider via python-telegram-bot (long-polling)."""

    @classmethod
    def get_provider_name(cls) -> str:
        return "telegram"

    def __init__(self, bot_token: str | None = None, **kwargs):
        """Initialize TelegramProvider with bot token from args or config."""
        config = Config()
        self._token = bot_token or config.telegram_bot_token
        self._bot: Bot | None = None
        self._app: Application | None = None
        self._on_message: MessageCallback | None = None

        if not self._token:
            printer.warning("KNIK_TELEGRAM_BOT_TOKEN not set. TelegramProvider is unconfigured.")
            return

        self._bot = Bot(token=self._token)
        printer.success("TelegramProvider initialized")

    async def send_message(self, chat_id: str, text: str, **kwargs) -> MessageResult:
        if not self.is_configured():
            return MessageResult(success=False, error="TelegramProvider is not configured")

        bot = self._app.bot if self._app else self._bot
        try:
            chunks = _split_text(text, max_len=4096)
            last_msg_id = None

            for chunk in chunks:
                msg = await bot.send_message(
                    chat_id=int(chat_id),
                    text=chunk,
                    **kwargs,
                )
                last_msg_id = str(msg.message_id)

            return MessageResult(success=True, message_id=last_msg_id)
        except Exception as e:
            printer.error(f"Telegram send_message failed: {e}")
            return MessageResult(success=False, error=str(e))

    def supports_message_edit(self) -> bool:
        return True

    async def edit_message(self, chat_id: str, message_id: str, text: str, **kwargs) -> MessageResult:
        if not self.is_configured():
            return MessageResult(success=False, error="TelegramProvider is not configured")

        bot = self._app.bot if self._app else self._bot

        try:
            chunks = _split_text(text, max_len=4096)

            msg = await bot.edit_message_text(
                chat_id=int(chat_id),
                message_id=int(message_id),
                text=chunks[0],
                **kwargs,
            )

            for chunk in chunks[1:]:
                await bot.send_message(
                    chat_id=int(chat_id),
                    text=chunk,
                    **kwargs,
                )

            return MessageResult(
                success=True,
                message_id=str(msg.message_id),
            )
        except Exception as e:
            error_str = str(e)
            if "message is not modified" in error_str:
                return MessageResult(success=True, message_id=message_id)
            printer.error(f"Telegram edit_message failed: {error_str}")
            return MessageResult(success=False, error=error_str)

    async def start(self, on_message: MessageCallback) -> None:
        if not self.is_configured():
            raise RuntimeError("Cannot start TelegramProvider: not configured (missing bot token)")

        self._on_message = on_message
        self._app = Application.builder().token(self._token).build()
        self._app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, self._handle_message))

        printer.info("TelegramProvider starting long-polling...")
        await self._app.initialize()
        await self._app.start()
        await self._app.updater.start_polling(drop_pending_updates=True)

    async def stop(self) -> None:
        if self._app is None:
            return

        printer.info("TelegramProvider stopping...")
        await self._app.updater.stop()
        await self._app.stop()
        await self._app.shutdown()
        self._app = None

    def is_configured(self) -> bool:
        return self._token is not None

    def get_info(self) -> dict[str, Any]:
        return {
            "provider": "telegram",
            "configured": self.is_configured(),
            "polling": self._app is not None,
        }

    async def _handle_message(self, update: Update, context) -> None:
        """Process an incoming Telegram update and forward to callback."""
        if update.message is None or update.message.text is None:
            return

        incoming = IncomingMessage(
            chat_id=str(update.message.chat_id),
            message_id=str(update.message.message_id),
            text=update.message.text,
            sender_id=str(update.message.from_user.id) if update.message.from_user else None,
            sender_name=update.message.from_user.full_name if update.message.from_user else None,
            timestamp=update.message.date.timestamp() if update.message.date else None,
            provider_name="telegram",
            raw=update.to_dict(),
        )

        if self._on_message:
            self._on_message(incoming)


def _split_text(text: str, max_len: int = 4096) -> list[str]:
    """Split text into chunks at newline boundaries for Telegram's limit."""
    if len(text) <= max_len:
        return [text]

    chunks = []
    while text:
        if len(text) <= max_len:
            chunks.append(text)
            break
        split_at = text.rfind("\n", 0, max_len)
        if split_at == -1:
            split_at = max_len
        chunks.append(text[:split_at])
        text = text[split_at:].lstrip("\n")
    return chunks


MessagingProviderRegistry.register(TelegramProvider.get_provider_name(), TelegramProvider)
