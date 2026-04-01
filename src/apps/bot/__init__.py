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
