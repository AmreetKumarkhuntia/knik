# Phase 5: BotApp Daemon, Package Init, and Main Entry Point

## Overview

**Phase ID:** 05
**Phase Name:** App Daemon & Entry Point
**Dependencies:** Phases 1-4 (Messaging Infrastructure, Config, Identity, Streaming, Handler)
**Files Changed:** 2 new, 1 modified

This is the **final phase** of the Bot App implementation. It creates the long-running daemon that ties all components together and provides the command-line entry point.

---

## 1. Purpose & Scope

### Goals
1. Create `BotApp` - an async daemon that orchestrates all bot components
2. Package all bot components via `__init__.py` for clean imports
3. Integrate with `main.py` to enable `python main.py --mode bot`

### Non-Goals
- Hot-reloading or code updates during runtime
- Distributed deployment (single-instance only)
- Built-in metrics/monitoring (use external tools)

---

## 2. BotApp Class Design

### File: `src/apps/bot/app.py` (NEW)

```python
"""Bot Application Daemon - Long-running async service for cross-platform messaging bot."""

import asyncio
import signal
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from lib.services.ai_client.client import AIClient
    from lib.services.ai_client.registry.mcp_registry import MCPServerRegistry

from imports import printer as logger
from lib.services.postgres.db import PostgresDB

from .config import BotConfig
from .message_handler import BotMessageHandler
from .streaming import StreamingResponseManager
from .user_identity import UserIdentityManager


class BotApp:
    """
    Long-running async daemon for the Bot application.

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

    def __init__(self, config: BotConfig | None = None):
        """
        Initialize BotApp with optional configuration.

        Args:
            config: BotConfig instance. If None, uses defaults from env.
        """
        self.config = config or BotConfig()

        # Component references (initialized in _initialize)
        self._messaging_client = None  # type: MessagingClient | None
        self._ai_client = None  # type: AIClient | None
        self._message_handler = None  # type: BotMessageHandler | None
        self._mcp_registry = None  # type: MCPServerRegistry | None
        self._user_identity = None  # type: UserIdentityManager | None
        self._streaming = None  # type: StreamingResponseManager | None

        # Shutdown coordination
        self._stop_event: asyncio.Event | None = None

    async def run(self) -> None:
        """
        Main async entry point. Runs until shutdown signal.

        This is the primary entry point called by asyncio.run().
        Handles the complete lifecycle: init -> run -> shutdown.
        """
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
        """
        Initialize all components in dependency order.

        Order matters:
        1. PostgresDB - required by AIClient for conversation persistence
        2. MCPServerRegistry - holds tool definitions
        3. AIClient - needs registry for tools
        4. MessagingClient - independent of AI
        5. UserIdentityManager - independent
        6. StreamingResponseManager - needs messaging client
        7. BotMessageHandler - needs all above
        """
        logger.info("Initializing Bot components...")

        # 1. Database (must be first - AIClient depends on it)
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
            model=self.config.ai_model,
            mcp_registry=self._mcp_registry,
            system_instruction=self.config.system_instruction,
        )
        logger.info(f"AI client initialized: {self._ai_client.get_model_name()}")

        # 4. Messaging Client
        logger.debug(f"Creating messaging client (providers={self.config.bot_providers})...")
        from .messaging_client import MessagingClient

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

        # 7. Message Handler (orchestrates everything)
        logger.debug("Creating bot message handler...")
        self._message_handler = BotMessageHandler(
            ai_client=self._ai_client,
            messaging_client=self._messaging_client,
            user_identity=self._user_identity,
            streaming=self._streaming,
            config=self.config,
        )
        logger.info("Bot message handler initialized")

        logger.info("All components initialized successfully")

    async def _run_loop(self) -> None:
        """
        Main run loop. Starts messaging and waits for shutdown.

        Sets up signal handlers for graceful shutdown on SIGINT/SIGTERM.
        """
        loop = asyncio.get_running_loop()
        self._stop_event = asyncio.Event()

        # Setup signal handlers
        def signal_handler():
            logger.info("Shutdown signal received")
            self._stop_event.set()

        for sig in (signal.SIGINT, signal.SIGTERM):
            loop.add_signal_handler(sig, signal_handler)

        # Start messaging client with callback
        logger.info("Starting messaging client...")
        await self._messaging_client.start(
            on_message=self._on_message,
            on_error=self._on_error,
        )

        logger.info(f"Bot is now running (providers: {self.config.bot_providers})")
        logger.info("Press Ctrl+C to shutdown")

        # Wait for shutdown signal
        try:
            await self._stop_event.wait()
        except asyncio.CancelledError:
            logger.info("Bot service cancelled")

    def _on_message(self, incoming) -> None:
        """
        Callback for MessagingClient. Forwards to BotMessageHandler.

        This is called by the messaging provider when a new message arrives.
        It's a sync callback that queues async work.

        Args:
            incoming: IncomingMessage from messaging provider
        """
        if self._message_handler is None:
            logger.warning("Message received but handler not initialized")
            return

        # Schedule async handling (don't await - this is a sync callback)
        asyncio.create_task(self._message_handler.handle(incoming))

    def _on_error(self, error: Exception, provider: str) -> None:
        """
        Callback for messaging errors.

        Args:
            error: The exception that occurred
            provider: Which provider had the error
        """
        logger.error(f"Messaging error from {provider}: {error}")

    async def _shutdown(self) -> None:
        """
        Graceful shutdown in reverse dependency order.

        Order:
        1. Cancel pending message handler tasks
        2. Stop messaging client (disconnect from providers)
        3. Close database connections
        """
        logger.info("Shutting down Bot Application...")

        # 1. Cancel pending handler tasks
        if self._message_handler:
            logger.debug("Cancelling pending message handlers...")
            try:
                await asyncio.wait_for(
                    self._message_handler.cancel_all(),
                    timeout=5.0
                )
            except asyncio.TimeoutError:
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
    """
    Standalone entry point for running the bot app directly.

    Usage:
        python -m apps.bot.app
    """
    config = BotConfig()
    app = BotApp(config)
    asyncio.run(app.run())


if __name__ == "__main__":
    main()
```

---

## 3. Initialization Sequence Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         BotApp.run()                                │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      _initialize()                                  │
└─────────────────────────────────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌───────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  1. PostgresDB│───▶│ 2. MCPServerRegistry│───▶│ 3. AIClient    │
│   .initialize()│    │  + register_tools() │    │ (with tools)  │
└───────────────┘    └──────────────────┘    └─────────────────┘
                                                      │
        ┌─────────────────────────────────────────────┤
        │                       │                     │
        ▼                       ▼                     ▼
┌───────────────────┐  ┌──────────────────┐  ┌─────────────────┐
│4. MessagingClient │  │5. UserIdentity   │  │6. StreamingResp │
│  (providers)      │  │   Manager        │  │   Manager       │
└───────────────────┘  └──────────────────┘  └─────────────────┘
        │                       │                     │
        └───────────────────────┼─────────────────────┘
                                ▼
                    ┌───────────────────────┐
                    │ 7. BotMessageHandler  │
                    │   (orchestrator)      │
                    └───────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        _run_loop()                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Setup signal handlers (SIGINT, SIGTERM)                     │   │
│  │ MessagingClient.start(on_message=_on_message)               │   │
│  │ await stop_event.wait()  # Block until shutdown signal      │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        _shutdown()                                  │
│  1. message_handler.cancel_all() [5s timeout]                      │
│  2. messaging_client.stop()                                         │
│  3. PostgresDB.close()                                              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. Shutdown Sequence

### Triggered By
- **SIGINT** (Ctrl+C)
- **SIGTERM** (kill command, systemd stop)
- **asyncio.CancelledError** (programmatic)

### Shutdown Order (Reverse of Init)

| Step | Action | Timeout | Rationale |
|------|--------|---------|-----------|
| 1 | `message_handler.cancel_all()` | 5s | Finish in-flight responses |
| 2 | `messaging_client.stop()` | None | Disconnect from providers |
| 3 | `PostgresDB.close()` | None | Release DB connections |

### Code Flow

```python
async def _shutdown(self) -> None:
    logger.info("Shutting down Bot Application...")

    # Step 1: Cancel pending handlers (with timeout)
    if self._message_handler:
        try:
            await asyncio.wait_for(
                self._message_handler.cancel_all(),
                timeout=5.0
            )
        except asyncio.TimeoutError:
            logger.warning("Timeout cancelling message handlers")

    # Step 2: Stop messaging
    if self._messaging_client:
        await self._messaging_client.stop()

    # Step 3: Close DB
    await PostgresDB.close()

    logger.info("Shutdown complete")
```

---

## 5. Signal Handling Details

### Implementation

```python
def _run_loop(self) -> None:
    loop = asyncio.get_running_loop()
    self._stop_event = asyncio.Event()

    def signal_handler():
        """Called on SIGINT/SIGTERM - triggers graceful shutdown."""
        logger.info("Shutdown signal received")
        self._stop_event.set()

    # Register for both signals
    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, signal_handler)

    # ... rest of run loop
```

### Signal Behavior

| Signal | Source | Behavior |
|--------|--------|----------|
| `SIGINT` | Ctrl+C | Graceful shutdown |
| `SIGTERM` | `kill`, systemd | Graceful shutdown |
| `SIGKILL` | `kill -9` | Immediate termination (no cleanup) |

### Platform Notes

- **Unix/Linux/macOS**: Full signal support
- **Windows**: Limited signal support (SIGINT via Ctrl+C works, SIGTERM may not)

---

## 6. Package Init Exports

### File: `src/apps/bot/__init__.py` (NEW)

```python
"""Standalone Bot App for Knik - cross-platform messaging bot.

This package provides a long-running daemon that connects to messaging
platforms (Telegram, Discord, etc.) and responds to user messages using AI.

Quick Start:
    from apps.bot import BotApp, BotConfig

    config = BotConfig()
    app = BotApp(config)
    asyncio.run(app.run())

Command Line:
    python main.py --mode bot
"""

from .app import BotApp
from .config import BotConfig
from .message_handler import BotMessageHandler
from .streaming import StreamingResponseManager
from .user_identity import UserIdentityManager

__all__ = [
    "BotApp",
    "BotConfig",
    "BotMessageHandler",
    "StreamingResponseManager",
    "UserIdentityManager",
]
```

### Export Summary

| Export | Purpose |
|--------|---------|
| `BotApp` | Main daemon class |
| `BotConfig` | Configuration dataclass |
| `BotMessageHandler` | Message processing orchestrator |
| `StreamingResponseManager` | Streaming text chunk delivery |
| `UserIdentityManager` | Cross-platform user ID mapping |

---

## 7. Main.py Changes

### File: `src/main.py` (MODIFY)

#### Location 1: Add new function after `run_cron_app()` (line ~60)

```python
def run_bot_app():
    """Run the Bot daemon application."""
    try:
        import asyncio

        from apps.bot import BotApp, BotConfig

        config = BotConfig()
        app = BotApp(config)
        asyncio.run(app.run())
    except ImportError as e:
        printer.error(f"Failed to import bot app: {e}")
        sys.exit(1)
    except Exception as e:
        printer.error(f"Failed to start bot app: {e}")
        sys.exit(1)
```

#### Location 2: Update argparse choices (line ~80)

```python
parser.add_argument(
    "--mode",
    choices=["console", "gui", "cron", "bot"],  # ADD "bot"
    default="gui",
    help="Application mode: console, gui, cron (scheduler), or bot (messaging)",
)
```

#### Location 3: Add mode handler (line ~92, after `elif args.mode == "cron"`)

```python
elif args.mode == "bot":
    run_bot_app()
```

#### Complete Modified Section

```python
def run_bot_app():
    """Run the Bot daemon application."""
    try:
        import asyncio

        from apps.bot import BotApp, BotConfig

        config = BotConfig()
        app = BotApp(config)
        asyncio.run(app.run())
    except ImportError as e:
        printer.error(f"Failed to import bot app: {e}")
        sys.exit(1)
    except Exception as e:
        printer.error(f"Failed to start bot app: {e}")
        sys.exit(1)


def main():
    """Main application function with mode selection."""
    parser = argparse.ArgumentParser(
        description="Knik - AI Application with Voice",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python main.py                   # Run GUI application (default)
  python main.py --mode gui        # Run GUI application
  python main.py --mode console    # Run terminal console
  python main.py --mode cron       # Run background scheduler
  python main.py --mode bot        # Run messaging bot daemon
        """,
    )

    parser.add_argument(
        "--mode",
        choices=["console", "gui", "cron", "bot"],
        default="gui",
        help="Application mode: console, gui, cron (scheduler), or bot (messaging)",
    )

    args = parser.parse_args()

    if args.mode == "console":
        run_console_app()
    elif args.mode == "gui":
        run_gui_app()
    elif args.mode == "cron":
        run_cron_app()
    elif args.mode == "bot":
        run_bot_app()
    else:
        printer.error(f"Unknown mode: {args.mode}")
        sys.exit(1)
```

---

## 8. Dependencies on Phases 1-4

### Phase Dependency Matrix

| Phase | Component | Used In |
|-------|-----------|---------|
| **Phase 1** | `MessagingClient` | `BotApp._initialize()`, `_on_message()` |
| **Phase 1** | `IncomingMessage` | `BotApp._on_message()` |
| **Phase 1** | `OutgoingMessage` | Streaming responses |
| **Phase 2** | `BotConfig` | `BotApp.__init__()`, all component configs |
| **Phase 3** | `UserIdentityManager` | `BotApp._initialize()` |
| **Phase 4** | `StreamingResponseManager` | `BotApp._initialize()` |
| **Phase 4** | `BotMessageHandler` | `BotApp._initialize()`, `_on_message()` |

### Import Dependencies

```python
# In app.py
from .config import BotConfig                    # Phase 2
from .message_handler import BotMessageHandler   # Phase 4
from .streaming import StreamingResponseManager  # Phase 4
from .user_identity import UserIdentityManager   # Phase 3
from .messaging_client import MessagingClient    # Phase 1
```

---

## 9. Testing Instructions

### Prerequisites

1. All Phases 1-4 implemented
2. Environment variables configured
3. Database running

### Required Environment Variables

```bash
# AI Provider
KNIK_AI_PROVIDER=vertex
KNIK_AI_MODEL=gemini-1.5-flash

# Database
KNIK_DB_HOST=localhost
KNIK_DB_PORT=5432
KNIK_DB_USER=postgres
KNIK_DB_PASS=your_password
KNIK_DB_NAME=knik

# Messaging (at least one required)
KNIK_TELEGRAM_BOT_TOKEN=your_telegram_token
# KNIK_DISCORD_BOT_TOKEN=your_discord_token

# Bot-specific (optional)
KNIK_BOT_PROVIDERS=telegram
```

### Test Commands

#### 1. Syntax Check

```bash
cd src
python -c "from apps.bot import BotApp, BotConfig; print('Import OK')"
```

#### 2. Configuration Validation

```bash
cd src
python -c "
from apps.bot.config import BotConfig
c = BotConfig()
print(f'Providers: {c.bot_providers}')
print(f'AI: {c.ai_provider}/{c.ai_model}')
"
```

#### 3. Startup Test (Quick Fail)

```bash
cd src
python main.py --mode bot
```

Expected output:
```
Starting Bot Application...
Initializing Bot components...
Initializing PostgresDB...
PostgresDB initialized
Setting up MCP tool registry...
Registered N MCP tools
Creating AI client (provider=vertex)...
AI client initialized: gemini-1.5-flash
Creating messaging client (providers=['telegram'])...
Messaging client created for: ['telegram']
Creating user identity manager...
User identity manager initialized
Creating streaming response manager...
Streaming response manager initialized
Creating bot message handler...
Bot message handler initialized
All components initialized successfully
Starting messaging client...
Bot is now running (providers: ['telegram'])
Press Ctrl+C to shutdown
```

#### 4. Graceful Shutdown Test

```bash
# Start the bot, then press Ctrl+C
cd src
python main.py --mode bot

# Expected on Ctrl+C:
# Shutdown signal received
# Shutting down Bot Application...
# Cancelling pending message handlers...
# Stopping messaging client...
# Closing database connections...
# Bot Application shutdown complete
```

### Integration Test

1. Start the bot: `python main.py --mode bot`
2. Send a message to the bot on configured platform
3. Verify response is received
4. Check logs for message processing flow

---

## 10. Deployment Considerations

### Environment Configuration

#### Production .env

```bash
# AI Configuration
KNIK_AI_PROVIDER=vertex
KNIK_AI_MODEL=gemini-1.5-flash
GOOGLE_CLOUD_PROJECT=your-project-id

# Database (production values)
KNIK_DB_HOST=db.internal.example.com
KNIK_DB_PORT=5432
KNIK_DB_USER=knik_bot
KNIK_DB_PASS=<secure-password>
KNIK_DB_NAME=knik_production

# Messaging
KNIK_BOT_PROVIDERS=telegram,discord
KNIK_TELEGRAM_BOT_TOKEN=<token>
KNIK_DISCORD_BOT_TOKEN=<token>

# Bot Behavior
KNIK_BOT_RESPONSE_TIMEOUT=60
KNIK_BOT_MAX_HISTORY=10
```

### Process Management

#### systemd Service Unit

```ini
# /etc/systemd/system/knik-bot.service
[Unit]
Description=Knik Bot Daemon
After=network.target postgresql.service

[Service]
Type=simple
User=knik
Group=knik
WorkingDirectory=/opt/knik/src
Environment="PATH=/opt/knik/venv/bin"
ExecStart=/opt/knik/venv/bin/python main.py --mode bot
Restart=always
RestartSec=5
TimeoutStopSec=30

[Install]
WantedBy=multi-user.target
```

#### Commands

```bash
# Install
sudo systemctl daemon-reload
sudo systemctl enable knik-bot
sudo systemctl start knik-bot

# Management
sudo systemctl status knik-bot
sudo systemctl restart knik-bot
sudo systemctl stop knik-bot

# Logs
journalctl -u knik-bot -f
```

### Docker Deployment

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY src/ /app/src/
COPY requirements.txt /app/

RUN pip install --no-cache-dir -r requirements.txt

WORKDIR /app/src
CMD ["python", "main.py", "--mode bot"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  knik-bot:
    build: .
    env_file: .env
    restart: always
    depends_on:
      - db
    networks:
      - knik-network

  db:
    image: postgres:15
    environment:
      POSTGRES_DB: knik
      POSTGRES_USER: knik
      POSTGRES_PASSWORD: ${KNIK_DB_PASS}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - knik-network

volumes:
  postgres-data:

networks:
  knik-network:
```

### Health Checks

```python
# Add to BotApp for health monitoring
async def health_check(self) -> dict:
    """Return health status of all components."""
    return {
        "status": "healthy",
        "messaging": self._messaging_client is not None,
        "ai_client": self._ai_client is not None,
        "database": PostgresDB._pool is not None,
    }
```

---

## 11. Full Command Reference

### Start Bot

```bash
cd src
python main.py --mode bot
```

### With Custom Config

```bash
cd src
python -c "
import asyncio
from apps.bot import BotApp, BotConfig

config = BotConfig(
    ai_provider='vertex',
    ai_model='gemini-1.5-pro',
    bot_providers=['telegram'],
)
app = BotApp(config)
asyncio.run(app.run())
"
```

### Direct Module Execution

```bash
cd src
python -m apps.bot.app
```

### Show Help

```bash
cd src
python main.py --help
```

---

## 12. Error Handling Summary

### Initialization Errors

| Error | Cause | Action |
|-------|-------|--------|
| `ImportError` | Missing dependencies | Install required packages |
| `DB connection failed` | Database unavailable | Check DB config and status |
| `Provider not configured` | Missing API keys | Set environment variables |

### Runtime Errors

| Error | Handling | Log Level |
|-------|----------|-----------|
| Message processing fail | Log and continue | ERROR |
| AI timeout | Send error message | WARNING |
| Messaging disconnect | Auto-reconnect | INFO |

### Shutdown Errors

| Error | Handling |
|-------|----------|
| Handler cancel timeout | Log warning, continue |
| Messaging stop fail | Log error, continue |
| DB close fail | Log error, continue |

---

## Summary

Phase 5 completes the Bot App implementation by creating:

1. **`BotApp`** - Async daemon with lifecycle management
2. **`__init__.py`** - Clean package exports
3. **`main.py`** - CLI entry point

The daemon follows the established pattern from `CronJobApp` and integrates all components from Phases 1-4 into a production-ready messaging bot.

**Final Command:**
```bash
python main.py --mode bot
```
