"""Bot Application Daemon - Long-running async service for cross-platform messaging bot."""

from __future__ import annotations

import asyncio
import contextlib
import signal
from typing import TYPE_CHECKING

from lib.mcp import register_all_tools
from lib.services.ai_client.client import AIClient
from lib.services.ai_client.registry.mcp_registry import MCPServerRegistry
from lib.services.messaging_client.client import MessagingClient


if TYPE_CHECKING:
    from lib.services.messaging_client.models import IncomingMessage

from imports import printer as logger
from lib.commands.service import CommandService
from lib.mcp.tools.browser_tool import BrowserTool
from lib.services.ai_client.base_tool import BaseTool
from lib.services.postgres.db import PostgresDB

from .commands import create_command_system
from .config import BotConfig
from .message_handler import BotMessageHandler
from .streaming import StreamingResponseManager
from .user_client_manager import UserClientManager
from .user_identity import UserIdentityManager


class BotApp:
    def __init__(self, config: BotConfig | None = None) -> None:
        self.config = config or BotConfig()

        self._messaging_client: MessagingClient | None = None
        self._user_client_manager: UserClientManager | None = None
        self._message_handler: BotMessageHandler | None = None
        self._user_identity: UserIdentityManager | None = None
        self._streaming: StreamingResponseManager | None = None
        self._command_service: CommandService | None = None

        self._stop_event: asyncio.Event | None = None

    async def run(self) -> None:
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

        await PostgresDB.initialize()
        logger.info("PostgresDB initialized")

        # Default client used by CommandService for model/provider/status queries.
        # Per-user clients are managed by UserClientManager.
        default_mcp = MCPServerRegistry()
        register_all_tools(default_mcp)
        default_client = AIClient(
            provider=self.config.ai_provider,
            mcp_registry=default_mcp,
            system_instruction=self.config.system_instruction,
        )
        logger.info(f"Default AI client initialized: {default_client.provider_name}")

        self._user_client_manager = UserClientManager(
            provider=self.config.ai_provider,
            system_instruction=self.config.system_instruction,
        )

        self._messaging_client = MessagingClient(providers=self.config.bot_providers)
        logger.info(f"Messaging client created for: {self.config.bot_providers}")

        self._user_identity = UserIdentityManager()
        self._streaming = StreamingResponseManager(
            messaging_client=self._messaging_client,
            config=self.config,
        )

        self._command_service = CommandService(
            ai_client=default_client,
            user_identity=self._user_identity,
            mcp_registry=default_mcp,
            system_instruction=self.config.system_instruction,
        )

        registry, dispatcher = create_command_system(self._command_service)
        logger.info(f"Registered {len(registry.list_commands())} bot commands")

        await self._messaging_client.register_bot_commands(registry.get_definitions())
        logger.info("Commands registered with messaging providers")

        self._message_handler = BotMessageHandler(
            command_service=self._command_service,
            messaging_client=self._messaging_client,
            user_identity=self._user_identity,
            streaming_manager=self._streaming,
            config=self.config,
            command_dispatcher=dispatcher,
            user_client_manager=self._user_client_manager,
        )
        logger.info("All components initialized successfully")

    async def _run_loop(self) -> None:
        loop = asyncio.get_running_loop()
        self._stop_event = asyncio.Event()

        for sig in (signal.SIGINT, signal.SIGTERM):
            loop.add_signal_handler(sig, self._stop_event.set)

        await self._messaging_client.start(on_message=self._on_message)

        logger.info(f"Bot is now running (providers: {self.config.bot_providers})")
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
                BrowserTool.cleanup_idle(self.config.browser_idle_timeout)
            except Exception as e:
                logger.warning(f"Auto-cleaner error: {e}")

    async def _on_message(self, incoming: IncomingMessage) -> None:
        if self._message_handler is None:
            logger.warning("Message received but handler not initialized")
            return

        asyncio.create_task(self._message_handler.handle(incoming))

    async def _shutdown(self) -> None:
        logger.info("Shutting down Bot Application...")

        shutdown_steps = [
            ("message handlers", self._shutdown_handlers),
            ("messaging client", self._shutdown_messaging),
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

    async def _shutdown_messaging(self) -> None:
        if self._messaging_client:
            await self._messaging_client.stop()

    async def _shutdown_database(self) -> None:
        await PostgresDB.close()

    def _shutdown_tool_sessions(self) -> None:
        BaseTool.cleanup_all()


def main() -> None:
    config = BotConfig()
    app = BotApp(config)
    asyncio.run(app.run())


if __name__ == "__main__":
    main()
