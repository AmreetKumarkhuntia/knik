"""Configuration for Web Backend - reads from environment variables."""

from dataclasses import dataclass, field

from lib.core.config import Config


@dataclass
class WebBackendConfig(Config):
    """Configuration for Web Backend application - extends Config."""

    # Web backend-specific settings
    host: str = field(default_factory=lambda: Config.from_env("KNIK_WEB_HOST", "0.0.0.0"))
    port: int = field(default_factory=lambda: Config.from_env("KNIK_WEB_PORT", 8000, int))
    reload: bool = field(default_factory=lambda: Config.from_env("KNIK_WEB_RELOAD", True, bool))
    history_context_size: int = field(default_factory=lambda: Config.from_env("KNIK_HISTORY_CONTEXT_SIZE", 5, int))
