"""Configuration for GUI application."""

from dataclasses import dataclass, field

from lib.core.config import Config


@dataclass
class GUIConfig(Config):
    """Configuration for GUI application - extends Config with GUI-specific settings."""

    # Window settings
    window_title: str = "Knik - AI Assistant"
    window_width: int = 1200
    window_height: int = 800
    min_width: int = 800
    min_height: int = 600

    # Theme
    appearance_mode: str = "dark"  # "dark", "light", "system"
    color_theme: str = "blue"  # "blue", "green", "dark-blue"

    # History
    max_history_size: int = field(default_factory=lambda: Config.from_env("KNIK_MAX_HISTORY_SIZE", 50, int))
    history_context_size: int = field(default_factory=lambda: Config.from_env("KNIK_HISTORY_CONTEXT_SIZE", 5, int))
