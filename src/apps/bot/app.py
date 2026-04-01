"""Bot Application Daemon - Long-running async service for cross-platform messaging bot."""

from __future__ import annotations

import asyncio
import signal
from typing import TYPE_CHECKING


if TYPE_CHECKING:
    from lib.services.ai_client.client import AIClient
    from lib.services.ai_client.registry.mcp_registry import MCPServerRegistry
    from lib.services.messaging_client.client import MessagingClient
    from lib.services.messaging_client.models import IncomingMessage

from imports import printer as logger
from lib.services.postgres.db import PostgresDB

from .config import BotConfig
from .message_handler import BotMessageHandler
from .streaming import StreamingResponseManager
from .user_identity import UserIdentityManager


class BotApp:
    """Long-running async daemon for the Bot application.

    Lifecycle:
    1. Initialize PostgresDB
    2. Setup MCPServerRegistry + register tools
    3. Create AIClient with tools
    4. Create MessagingClient with configured providers
    5. Create UserIdentityManager, StreamingResponseManager, BotMessageHandler
    6. Start MessagingClient with on_message callback
    7. Wait for shutdown signal
    8. Graceful shutdown: cancel tasks, stop messaging, close DB

    Example:
        config = BotConfig()
        app = BotApp(config)
        asyncio.run(app.run())
    """

    def __init__(self, config: BotConfig | None = None) -> None:
        self.config = config or BotConfig()

        self._messaging_client: MessagingClient | None = None
        self._ai_client: AIClient | None = None
        self._message_handler: BotMessageHandler | None = None
        self._mcp_registry: MCPServerRegistry | None = None
        self._user_identity: UserIdentityManager | None = None
        self._streaming: StreamingResponseManager | None = None

        self._stop_event: asyncio.Event | None = None

    async def run(self) -> None:
        """Main async entry point. Runs until shutdown signal."""
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
        """Initialize all components in dependency order."""
        logger.info("Initializing Bot components...")

        # 1. Database
        logger.debug("Initializing PostgresDB...")
        await PostgresDB.initialize()
        logger.info("PostgresDB initialized")

        # 2. MCP Registry with tools
        logger.debug("Setting up MCP tool registry...")
        from lib.mcp import register_all_tools
        from lib.services.ai_client.registry.mcp_registry import MCPServerRegistry

        self._mcp_registry = MCPServerRegistry()
        tool_count = register_all_tools(self._mcp_registry)
        logger.info(f"Registered {tool_count} MCP tools")

        # 3. AI Client
        logger.debug(f"Creating AI client (provider={self.config.ai_provider})...")
        from lib.services.ai_client.client import AIClient

        self._ai_client = AIClient(
            provider=self.config.ai_provider,
            mcp_registry=self._mcp_registry,
            system_instruction=self.config.system_instruction,
        )
        logger.info(f"AI client initialized: {self._ai_client.provider_name}")

        # 4. Messaging Client
        logger.debug(f"Creating messaging client (providers={self.config.bot_providers})...")
        from lib.services.messaging_client.client import MessagingClient

        self._messaging_client = MessagingClient(providers=self.config.bot_providers)
        logger.info(f"Messaging client created for: {self.config.bot_providers}")

        # 5. User Identity Manager
        logger.debug("Creating user identity manager...")
        self._user_identity = UserIdentityManager()
        logger.info("User identity manager initialized")

        # 6. Streaming Response Manager
        logger.debug("Creating streaming response manager...")
        self._streaming = StreamingResponseManager(
            messaging_client=self._messaging_client,
            config=self.config,
        )
        logger.info("Streaming response manager initialized")

        # 7. Message Handler
        logger.debug("Creating bot message handler...")
        self._message_handler = BotMessageHandler(
            ai_client=self._ai_client,
            messaging_client=self._messaging_client,
            user_identity=self._user_identity,
            streaming_manager=self._streaming,
            config=self.config,
        )
        logger.info("Bot message handler initialized")

        logger.info("All components initialized successfully")

    async def _run_loop(self) -> None:
        """Main run loop. Starts messaging and waits for shutdown."""
        loop = asyncio.get_running_loop()
        self._stop_event = asyncio.Event()

        def signal_handler() -> None:
            logger.info("Shutdown signal received")
            self._stop_event.set()

        for sig in (signal.SIGINT, signal.SIGTERM):
            loop.add_signal_handler(sig, signal_handler)

        logger.info("Starting messaging client...")
        await self._messaging_client.start(on_message=self._on_message)

        logger.info(f"Bot is now running (providers: {self.config.bot_providers})")
        logger.info("Press Ctrl+C to shutdown")

        try:
            await self._stop_event.wait()
        except asyncio.CancelledError:
            logger.info("Bot service cancelled")

    def _on_message(self, incoming: IncomingMessage) -> None:
        """Sync callback from MessagingClient. Schedules async handling."""
        if self._message_handler is None:
            logger.warning("Message received but handler not initialized")
            return

        asyncio.create_task(self._message_handler.handle(incoming))

    async def _shutdown(self) -> None:
        """Graceful shutdown in reverse dependency order."""
        logger.info("Shutting down Bot Application...")

        # 1. Cancel pending handler tasks
        if self._message_handler:
            logger.debug("Cancelling pending message handlers...")
            try:
                await asyncio.wait_for(self._message_handler.cancel_all(), timeout=5.0)
            except TimeoutError:
                logger.warning("Timeout cancelling message handlers")
            except Exception as e:
                logger.error(f"Error cancelling handlers: {e}")

        # 2. Stop messaging client
        if self._messaging_client:
            logger.debug("Stopping messaging client...")
            try:
                await self._messaging_client.stop()
            except Exception as e:
                logger.error(f"Error stopping messaging client: {e}")

        # 3. Close database
        logger.debug("Closing database connections...")
        try:
            await PostgresDB.close()
        except Exception as e:
            logger.error(f"Error closing database: {e}")

        logger.info("Bot Application shutdown complete")


def main() -> None:
    """Standalone entry point for running the bot app directly.

    Usage:
        python -m apps.bot.app
    """
    config = BotConfig()
    app = BotApp(config)
    asyncio.run(app.run())


if __name__ == "__main__":
    main()
