"""Bot application configuration."""

from dataclasses import dataclass, field
from typing import ClassVar

from lib.core.config import Config


@dataclass
class BotConfig(Config):
    DEFAULT_BOT_PROVIDERS: ClassVar[list[str]] = ["telegram"]
    DEFAULT_CONCURRENT_LIMIT: ClassVar[int] = 10

    bot_enabled: bool = field(default_factory=lambda: Config.from_env("KNIK_BOT_ENABLED", True, bool))

    bot_providers: list[str] = field(default_factory=lambda: BotConfig._parse_providers())

    bot_concurrent_limit: int = field(
        default_factory=lambda: Config.from_env("KNIK_BOT_CONCURRENT_LIMIT", BotConfig.DEFAULT_CONCURRENT_LIMIT, int)
    )

    busy_message: str = "I'm still thinking about your previous message."
    error_message: str = "Sorry, an error occurred while processing your message."

    @classmethod
    def _parse_providers(cls) -> list[str]:
        raw = Config.from_env("KNIK_BOT_PROVIDERS", None)
        if not raw:
            return cls.DEFAULT_BOT_PROVIDERS.copy()

        providers = [p.strip().lower() for p in raw.split(",") if p.strip()]
        return providers if providers else cls.DEFAULT_BOT_PROVIDERS.copy()

    def is_provider_enabled(self, provider: str) -> bool:
        return provider.lower() in self.bot_providers
