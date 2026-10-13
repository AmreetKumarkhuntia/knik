"""Bot application configuration."""

from dataclasses import dataclass, field
from typing import ClassVar

from imports import Config


@dataclass
class BotConfig(Config):
    DEFAULT_CONCURRENT_LIMIT: ClassVar[int] = 10

    bot_enabled: bool = field(default_factory=lambda: Config.from_env("KNIK_BOT_ENABLED", True, bool))

    bot_concurrent_limit: int = field(
        default_factory=lambda: Config.from_env("KNIK_BOT_CONCURRENT_LIMIT", BotConfig.DEFAULT_CONCURRENT_LIMIT, int)
    )

    busy_message: str = "I'm still thinking about your previous message."
    error_message: str = "Sorry, an error occurred while processing your message."
