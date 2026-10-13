"""Telegram bot client on python-telegram-bot: long polling in, chunked and draft-streamed messages out."""

from __future__ import annotations

import asyncio
import random
import traceback
from collections.abc import AsyncIterator, Awaitable, Callable
from typing import Any

from telegram import Bot, Message, Update
from telegram import BotCommand as TelegramBotCommand
from telegram.ext import AIORateLimiter, Application, CommandHandler, ContextTypes, MessageHandler, filters

from lib.core.config import Config
from lib.utils.printer import printer

from .models import BotCommand, IncomingMessage, MessageResult


MessageCallback = Callable[[IncomingMessage], Awaitable[None]]

MAX_MESSAGE_LENGTH = 4096
_DRAFT_DEBOUNCE: float = 0.5


class TelegramClient:
    max_message_length: int = MAX_MESSAGE_LENGTH

    def __init__(self, bot_token: str | None = None) -> None:
        self._token = bot_token or Config().telegram_bot_token
        self._bot: Bot | None = None
        self._app: Application | None = None
        self._on_message: MessageCallback | None = None

        if not self._token:
            printer.warning("KNIK_TELEGRAM_BOT_TOKEN not set. TelegramClient is unconfigured.")
            return

        self._bot = Bot(token=self._token)
        printer.success("TelegramClient initialized")

    def is_configured(self) -> bool:
        return bool(self._token)

    async def start(self, on_message: MessageCallback) -> None:
        if not self._token:
            raise RuntimeError("Cannot start TelegramClient: not configured (missing bot token)")

        self._on_message = on_message
        app = (
            Application.builder()
            .token(self._token)
            .rate_limiter(AIORateLimiter())
            .read_timeout(10.0)
            .write_timeout(10.0)
            .connect_timeout(10.0)
            .pool_timeout(5.0)
            .build()
        )
        app.add_handler(CommandHandler("start", self._handle_command))
        app.add_handler(MessageHandler(filters.TEXT, self._handle_message))
        app.add_error_handler(self._handle_error)
        self._app = app

        printer.info("TelegramClient starting long-polling...")
        try:
            await app.initialize()
            await app.start()
            await app.updater.start_polling(drop_pending_updates=True)
        except Exception:
            try:
                await self.stop()
            except Exception as stop_error:
                printer.warning(f"TelegramClient cleanup after a failed start also failed: {stop_error}")
            raise

    async def stop(self) -> None:
        app, self._app = self._app, None
        if app is None:
            return

        printer.info("TelegramClient stopping...")
        # stop() also runs after a start() that failed part-way, so only undo the steps that ran.
        if app.updater is not None and app.updater.running:
            await app.updater.stop()
        if app.running:
            await app.stop()
        await app.shutdown()
        # Application.shutdown() skips the bot when initialize() failed, which would leave its HTTP clients open.
        await app.bot.shutdown()

    async def send_message(self, chat_id: str, text: str, **kwargs: Any) -> MessageResult:
        bot = self._current_bot()
        if bot is None:
            return MessageResult(success=False, error="TelegramClient is not configured")

        try:
            message_id = await self._send_chunks(bot, int(chat_id), text, **kwargs)
        except Exception as e:
            printer.error(f"Telegram send_message failed: {e}")
            return MessageResult(success=False, error=str(e))
        return MessageResult(success=True, message_id=message_id)

    async def send_stream(self, chat_id: str, text_stream: AsyncIterator[str], **kwargs: Any) -> MessageResult:
        """Show the text as a live draft while it streams, then send it as permanent messages."""
        bot = self._current_bot()
        if bot is None:
            return MessageResult(success=False, error="TelegramClient is not configured")

        chat_id_int = int(chat_id)
        # sendMessageDraft only works in private chats, and private chat ids are the positive ones.
        use_drafts = chat_id_int > 0
        draft_id = random.randint(1, 2**31 - 1)
        accumulated = ""
        last_draft_at = 0.0
        draft_warned = False
        loop = asyncio.get_running_loop()

        try:
            async for chunk in text_stream:
                accumulated += chunk
                now = loop.time()
                if not use_drafts or now - last_draft_at < _DRAFT_DEBOUNCE:
                    continue
                last_draft_at = now
                try:
                    await bot.send_message_draft(chat_id=chat_id_int, draft_id=draft_id, text=accumulated)
                except Exception as e:
                    # Warn once per stream: a broken draft fails on every update and would flood the log.
                    if not draft_warned:
                        printer.warning(f"Telegram draft update failed for chat {chat_id}: {e}")
                        draft_warned = True

            if not accumulated:
                return MessageResult(success=True)

            message_id = await self._send_chunks(bot, chat_id_int, accumulated, **kwargs)
        except Exception as e:
            printer.error(f"Telegram send_stream failed: {e}")
            return MessageResult(success=False, error=str(e))
        return MessageResult(success=True, message_id=message_id)

    async def register_commands(self, commands: list[BotCommand]) -> None:
        """Publish the command menu Telegram shows users. Failures are logged, not raised."""
        bot = self._current_bot()
        if bot is None:
            return

        try:
            await bot.set_my_commands([TelegramBotCommand(cmd.name, cmd.description) for cmd in commands])
        except Exception as e:
            printer.warning(f"Telegram set_my_commands failed: {e}")
            return
        printer.info(f"Registered {len(commands)} commands with Telegram")

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

    def _current_bot(self) -> Bot | None:
        # The running Application's bot goes through the rate limiter; the plain Bot serves calls made before start().
        return self._app.bot if self._app is not None else self._bot

    async def _send_chunks(self, bot: Bot, chat_id: int, text: str, **kwargs: Any) -> str | None:
        message_id: str | None = None
        for chunk in self.chunk_text(text):
            message = await bot.send_message(chat_id=chat_id, text=chunk, **kwargs)
            message_id = str(message.message_id)
        return message_id

    async def _handle_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        if update.message is None:
            return

        text = update.message.text or ""
        # Telegram sends /start when a user first opens the bot; the bot answers it as a fresh session.
        if text.startswith("/start"):
            text = "/new"
        await self._deliver(update, update.message, text)

    async def _handle_message(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        if update.message is None or update.message.text is None:
            return
        await self._deliver(update, update.message, update.message.text)

    async def _deliver(self, update: Update, message: Message, text: str) -> None:
        if self._on_message is None:
            return

        sender = message.from_user
        await self._on_message(
            IncomingMessage(
                chat_id=str(message.chat_id),
                message_id=str(message.message_id),
                text=text,
                sender_id=str(sender.id) if sender else None,
                sender_name=sender.full_name if sender else None,
                timestamp=message.date.timestamp() if message.date else None,
                raw=update.to_dict(),
            )
        )

    async def _handle_error(self, update: object, context: ContextTypes.DEFAULT_TYPE) -> None:
        error = context.error
        # The traceback is the only way to find a bug raised from inside a handler or the on_message callback.
        details = "".join(traceback.format_exception(error)) if error is not None else "unknown error"
        printer.error(f"Telegram update handling failed:\n{details}")
