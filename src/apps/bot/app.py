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
from lib.commands.service import CommandService
from lib.services.postgres.db import PostgresDB
from lib.services.tool_session.manager import ToolSessionManager

from .commands import create_command_system
from .config import BotConfig
from .message_handler import BotMessageHandler
from .streaming import StreamingResponseManager
from .user_identity import UserIdentityManager


class BotApp:
    def __init__(self, config: BotConfig | None = None) -> None:
        self.config = config or BotConfig()

        self._messaging_client: MessagingClient | None = None
        self._ai_client: AIClient | None = None
        self._message_handler: BotMessageHandler | None = None
        self._mcp_registry: MCPServerRegistry | None = None
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

        from lib.mcp import register_all_tools
        from lib.services.ai_client.registry.mcp_registry import MCPServerRegistry

        self._mcp_registry = MCPServerRegistry()
        tool_count = register_all_tools(self._mcp_registry)
        logger.info(f"Registered {tool_count} MCP tools")

        from lib.services.ai_client.client import AIClient

        self._ai_client = AIClient(
            provider=self.config.ai_provider,
            mcp_registry=self._mcp_registry,
            system_instruction=self.config.system_instruction,
        )
        logger.info(f"AI client initialized: {self._ai_client.provider_name}")

        from lib.services.messaging_client.client import MessagingClient

        self._messaging_client = MessagingClient(providers=self.config.bot_providers)
        logger.info(f"Messaging client created for: {self.config.bot_providers}")

        self._user_identity = UserIdentityManager()
        self._streaming = StreamingResponseManager(
            messaging_client=self._messaging_client,
            config=self.config,
        )

        self._command_service = CommandService(
            ai_client=self._ai_client,
            user_identity=self._user_identity,
            mcp_registry=self._mcp_registry,
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
            await self._stop_event.wait()
        except asyncio.CancelledError:
            logger.info("Bot service cancelled")

    def _on_message(self, incoming: IncomingMessage) -> None:
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
        ToolSessionManager.get_instance().cleanup_all()


def main() -> None:
    config = BotConfig()
    app = BotApp(config)
    asyncio.run(app.run())


if __name__ == "__main__":
    main()
