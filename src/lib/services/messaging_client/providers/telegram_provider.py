"""Telegram messaging provider using python-telegram-bot."""

from __future__ import annotations

import asyncio
import random
from collections.abc import AsyncIterator
from typing import Any

from telegram import Bot, Update
from telegram.ext import AIORateLimiter, Application, CommandHandler, MessageHandler, filters

from ....core.config import Config
from ....utils import printer
from ..models import CommandDefinition, IncomingMessage, MessageResult
from ..registry import MessagingProviderRegistry
from .base_provider import BaseMessagingProvider, MessageCallback


_DRAFT_DEBOUNCE: float = 0.5


class TelegramProvider(BaseMessagingProvider):
    """Telegram bot provider via python-telegram-bot (long-polling)."""

    @classmethod
    def get_provider_name(cls) -> str:
        return "telegram"

    def __init__(self, bot_token: str | None = None, **kwargs):
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
            chunks = self.chunk_text(text)
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

    async def send_stream(self, chat_id: str, text_stream: AsyncIterator[str], **kwargs) -> MessageResult:
        if not self.is_configured():
            return MessageResult(success=False, error="TelegramProvider is not configured")

        bot = self._app.bot if self._app else self._bot
        chat_id_int = int(chat_id)
        accumulated = ""
        last_update_time: float = 0.0
        draft_id: int = random.randint(1, 2**31 - 1)

        try:
            async for chunk in text_stream:
                accumulated += chunk
                now = asyncio.get_event_loop().time()
                if now - last_update_time >= _DRAFT_DEBOUNCE:
                    try:
                        await bot.send_message_draft(
                            chat_id=chat_id_int,
                            draft_id=draft_id,
                            text=accumulated,
                        )
                        last_update_time = now
                    except Exception:
                        pass  # silently skip — group chats, transient errors, etc.

            if not accumulated:
                return MessageResult(success=True)

            message_id: int | None = None
            for c in self.chunk_text(accumulated):
                msg = await bot.send_message(chat_id=chat_id_int, text=c, **kwargs)
                message_id = msg.message_id

            return MessageResult(success=True, message_id=str(message_id) if message_id else None)
        except Exception as e:
            printer.error(f"Telegram send_stream failed: {e}")
            return MessageResult(success=False, error=str(e))

    async def start(self, on_message: MessageCallback) -> None:
        if not self.is_configured():
            raise RuntimeError("Cannot start TelegramProvider: not configured (missing bot token)")

        self._on_message = on_message
        self._app = (
            Application.builder()
            .token(self._token)
            .rate_limiter(AIORateLimiter())
            .read_timeout(10.0)
            .write_timeout(10.0)
            .connect_timeout(10.0)
            .pool_timeout(5.0)
            .build()
        )
        self._app.add_handler(CommandHandler("start", self._handle_command))
        self._app.add_handler(MessageHandler(filters.TEXT, self._handle_message))

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

    async def _handle_command(self, update: Update, context) -> None:
        if update.message is None:
            return

        text = update.message.text or ""
        if text.startswith("/start"):
            text = "/new"

        incoming = IncomingMessage(
            chat_id=str(update.message.chat_id),
            message_id=str(update.message.message_id),
            text=text,
            sender_id=str(update.message.from_user.id) if update.message.from_user else None,
            sender_name=update.message.from_user.full_name if update.message.from_user else None,
            timestamp=update.message.date.timestamp() if update.message.date else None,
            provider_name="telegram",
            raw=update.to_dict(),
        )

        if self._on_message:
            await self._on_message(incoming)

    async def _handle_message(self, update: Update, context) -> None:
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
            await self._on_message(incoming)

    async def register_bot_commands(self, commands: list[CommandDefinition]) -> None:
        from telegram import BotCommand as TgBotCommand

        bot = self._app.bot if self._app else self._bot
        if not bot:
            return

        tg_commands = [TgBotCommand(cmd.name, cmd.description) for cmd in commands]
        await bot.set_my_commands(tg_commands)
        printer.info(f"Registered {len(tg_commands)} commands with Telegram")


MessagingProviderRegistry.register(TelegramProvider.get_provider_name(), TelegramProvider)
