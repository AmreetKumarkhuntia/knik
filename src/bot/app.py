"""Bot Application Daemon - Long-running async service for the Telegram bot."""

from __future__ import annotations

import asyncio
import contextlib
import signal
from functools import partial
from typing import TYPE_CHECKING

from imports import (
    DB_ERRORS,
    CommandService,
    IncomingMessage,
    PostgresDB,
    TelegramClient,
    browser,
    cleanup_all_tools,
)
from imports import printer as logger

from .commands import create_command_system
from .config import BotConfig
from .consent import ConsentBroker
from .message_handler import BotMessageHandler
from .streaming import StreamingResponseManager
from .user_client_manager import UserClientManager
from .user_identity import UserIdentityManager


if TYPE_CHECKING:
    from .transport import MessagingTransport


class BotApp:
    def __init__(self, config: BotConfig | None = None, transport: MessagingTransport | None = None) -> None:
        self.config = config or BotConfig()

        self._transport: MessagingTransport | None = transport
        self._user_client_manager: UserClientManager | None = None
        self._message_handler: BotMessageHandler | None = None
        self._user_identity: UserIdentityManager | None = None
        self._streaming: StreamingResponseManager | None = None
        self._command_service: CommandService | None = None

        self._stop_event: asyncio.Event | None = None
        # Strong references, so a message being handled is not garbage-collected mid-reply.
        self._handling: set[asyncio.Task] = set()

    async def run(self) -> None:
        if not self.config.bot_enabled:
            logger.warning("Bot is disabled (KNIK_BOT_ENABLED is false); not starting")
            return

        logger.info("Starting Bot Application...")

        try:
            await self._initialize()
            await self._run_loop()
        except Exception as e:
            logger.error(f"Bot application error: {e}")
            raise
        finally:
            await self._shutdown()

    async def _initialize(self) -> None:
        logger.info("Initializing Bot components...")

        try:
            await PostgresDB.initialize()
            logger.info("PostgresDB initialized")
        except DB_ERRORS as e:
            # The bot can still chat without Postgres; only conversation history is lost.
            logger.warning(f"PostgresDB unavailable, continuing without it: {e}")

        loop = asyncio.get_running_loop()

        if self._transport is None:
            self._transport = TelegramClient()
        transport = self._transport

        consent_broker = ConsentBroker()
        self._user_client_manager = UserClientManager(
            ai_provider=self.config.ai_provider,
            system_instruction=self.config.system_instruction,
            transport=transport,
            loop=loop,
            consent_broker=consent_broker,
        )

        self._user_identity = UserIdentityManager()
        self._streaming = StreamingResponseManager(transport=transport, config=self.config)

        # Commands act on the sender's own client, which UserClientManager builds on first use.
        self._command_service = CommandService(
            client_resolver=self._user_client_manager.get_or_create,
            user_identity=self._user_identity,
        )

        registry, dispatcher = create_command_system(self._command_service, self._user_client_manager)
        logger.info(f"Registered {len(registry.list_commands())} bot commands")

        await transport.register_commands(registry.get_bot_commands())

        self._message_handler = BotMessageHandler(
            transport=transport,
            user_identity=self._user_identity,
            streaming_manager=self._streaming,
            config=self.config,
            user_client_manager=self._user_client_manager,
            consent_broker=consent_broker,
            command_dispatcher=dispatcher,
        )
        logger.info("All components initialized successfully")

    async def _run_loop(self) -> None:
        loop = asyncio.get_running_loop()
        self._stop_event = asyncio.Event()

        for sig in (signal.SIGINT, signal.SIGTERM):
            loop.add_signal_handler(sig, self._stop_event.set)

        await self._transport.start(on_message=self._on_message)

        logger.info("Bot is now running (Telegram long polling)")
        logger.info("Press Ctrl+C to shutdown")

        try:
            cleaner_task = asyncio.create_task(self._auto_cleaner(), name="browser-auto-cleaner")
            await self._stop_event.wait()
            cleaner_task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await cleaner_task
        except asyncio.CancelledError:
            logger.info("Bot service cancelled")

    async def _auto_cleaner(self) -> None:
        """Background task: close idle browser sessions every 5 minutes."""
        while True:
            await asyncio.sleep(300)
            try:
                browser.cleanup_idle(self.config.browser_idle_timeout)
            except Exception as e:
                logger.warning(f"Auto-cleaner error: {e}")

    async def _on_message(self, incoming: IncomingMessage) -> None:
        if self._message_handler is None:
            logger.warning("Message received but handler not initialized")
            return

        task = asyncio.create_task(self._message_handler.handle(incoming))
        self._handling.add(task)
        task.add_done_callback(partial(self._handled, incoming))

    def _handled(self, incoming: IncomingMessage, task: asyncio.Task) -> None:
        self._handling.discard(task)
        if not task.cancelled() and task.exception() is not None:
            logger.error(
                f"Handling message {incoming.message_id} from chat {incoming.chat_id} failed: {task.exception()}"
            )

    async def _shutdown(self) -> None:
        logger.info("Shutting down Bot Application...")

        shutdown_steps = [
            ("message handlers", self._shutdown_handlers),
            ("messaging transport", self._shutdown_transport),
            ("database", self._shutdown_database),
        ]

        for name, step in shutdown_steps:
            try:
                await step()
            except Exception as e:
                logger.error(f"Error during {name} shutdown: {e}")

        try:
            self._shutdown_tool_sessions()
        except Exception as e:
            logger.error(f"Error during tool session shutdown: {e}")

        logger.info("Bot Application shutdown complete")

    async def _shutdown_handlers(self) -> None:
        if self._message_handler:
            await asyncio.wait_for(self._message_handler.cancel_all(), timeout=5.0)

    async def _shutdown_transport(self) -> None:
        if self._transport:
            await self._transport.stop()

    async def _shutdown_database(self) -> None:
        await PostgresDB.close()

    def _shutdown_tool_sessions(self) -> None:
        cleanup_all_tools()


def main() -> None:
    config = BotConfig()
    app = BotApp(config)
    asyncio.run(app.run())


if __name__ == "__main__":
    main()
