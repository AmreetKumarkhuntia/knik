"""Configuration for GUI application."""

from dataclasses import dataclass

from lib.core.config import Config


@dataclass
class GUIConfig:
    """Configuration for GUI application - extends core Config with GUI-specific settings."""

    # Window settings
    window_title: str = "Knik - AI Assistant"
    window_width: int = 1200
    window_height: int = 800
    min_width: int = 800
    min_height: int = 600

    # Theme
    appearance_mode: str = "dark"  # "dark", "light", "system"
    color_theme: str = "blue"  # "blue", "green", "dark-blue"

    # AI settings (from core Config)
    ai_provider: str = Config.from_env("KNIK_AI_PROVIDER", "vertex")
    ai_project_id: str = Config.get_ai_project() or ""
    ai_location: str = Config.get_ai_location()
    ai_model: str = Config.get_ai_model()
    max_tokens: int = Config.from_env("KNIK_MAX_TOKENS", Config.DEFAULT_AI_MAX_TOKENS, int)
    temperature: float = Config.from_env("KNIK_TEMPERATURE", Config.DEFAULT_AI_TEMPERATURE, float)

    # TTS settings (from core Config)
    enable_voice_output: bool = Config.from_env("KNIK_ENABLE_VOICE", True, bool)
    voice_name: str = Config.get_voice()
    sample_rate: int = Config.SAMPLE_RATE

    # History
    max_history_size: int = Config.from_env("KNIK_MAX_HISTORY_SIZE", 50, int)

    # System instruction
    def __post_init__(self):
        self.system_instruction = Config.from_env("KNIK_AI_SYSTEM_INSTRUCTION", Config.DEFAULT_SYSTEM_INSTRUCTION)
