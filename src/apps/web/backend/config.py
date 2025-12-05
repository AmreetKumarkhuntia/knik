"""Configuration for Web Backend - reads from environment variables."""

from dataclasses import dataclass

from lib.core.config import Config


@dataclass
class WebBackendConfig:
    """Configuration for Web Backend application - extends core Config."""

    # AI settings (from core Config)
    ai_provider: str = Config.from_env("KNIK_AI_PROVIDER", "vertex")
    ai_model: str = Config.from_env("KNIK_AI_MODEL", Config.DEFAULT_AI_MODEL)
    ai_project_id: str | None = Config.from_env("GOOGLE_CLOUD_PROJECT", None)
    ai_location: str = Config.from_env("KNIK_AI_LOCATION", Config.DEFAULT_AI_LOCATION)
    max_tokens: int = Config.from_env("KNIK_MAX_TOKENS", Config.DEFAULT_AI_MAX_TOKENS, int)
    temperature: float = Config.from_env("KNIK_TEMPERATURE", Config.DEFAULT_AI_TEMPERATURE, float)

    # TTS settings (from core Config)
    voice_language: str = Config.get_language()
    voice_name: str = Config.get_voice()
    sample_rate: int = Config.SAMPLE_RATE
    enable_voice_output: bool = Config.from_env("KNIK_VOICE_OUTPUT", True, bool)

    # Web backend-specific settings
    host: str = Config.from_env("KNIK_WEB_HOST", "0.0.0.0")
    port: int = Config.from_env("KNIK_WEB_PORT", 8000, int)
    reload: bool = Config.from_env("KNIK_WEB_RELOAD", True, bool)
    history_context_size: int = Config.from_env("KNIK_HISTORY_CONTEXT_SIZE", 5, int)

    def __post_init__(self):
        """Initialize system instruction from environment."""
        self.system_instruction = Config.from_env("KNIK_AI_SYSTEM_INSTRUCTION", Config.DEFAULT_SYSTEM_INSTRUCTION)
