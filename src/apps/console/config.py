from dataclasses import dataclass, field

from lib.core.config import Config


@dataclass
class ConsoleConfig(Config):
    """Configuration for Console application - extends Config with console-specific settings."""

    # Console-specific settings
    command_prefix: str = "/"
    max_history_size: int = 50
    history_context_size: int = field(default_factory=lambda: Config.from_env("KNIK_HISTORY_CONTEXT_SIZE", 5, int))
    show_timestamps: bool = False
    welcome_message: str = "🤖 Knik Console - Your AI Assistant with Voice"
    prompt_symbol: str = "You: "
    assistant_symbol: str = "AI: "
    debug_mode: bool = False
    loop_check_timeout: int = 500.0
    loop_check_interval: int = 3.0
