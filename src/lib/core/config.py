"""
Configuration module for application settings and constants.
Supports loading configuration from environment variables with sensible defaults.
"""

import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import ClassVar

from dotenv import load_dotenv


# Always load the .env file relative to the project root
_ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent
_ENV_PATH = _ROOT_DIR / ".env"
if _ENV_PATH.exists():
    load_dotenv(dotenv_path=_ENV_PATH)
else:
    load_dotenv()


@dataclass
class Config:
    """Configuration class for application settings (TTS, AI, logging, etc.)."""

    SAMPLE_RATE: ClassVar[int] = 24000

    DEFAULT_TTS: ClassVar[str] = "kokoro"
    DEFAULT_LANGUAGE: ClassVar[str] = "a"
    DEFAULT_VOICE: ClassVar[str] = "af_heart"
    DEFAULT_MODEL: ClassVar[str] = "hexgrad/Kokoro-82M"

    DEFAULT_AI_MODEL: ClassVar[str] = "gemini-1.5-flash"
    DEFAULT_AI_LOCATION: ClassVar[str] = "us-central1"
    DEFAULT_AI_MAX_TOKENS: ClassVar[int] = 25565
    DEFAULT_AI_TEMPERATURE: ClassVar[float] = 0.7

    DEFAULT_LOG_LEVEL: ClassVar[str] = "INFO"
    DEFAULT_SHOW_LOGS: ClassVar[bool] = True
    DEFAULT_USE_COLORS: ClassVar[bool] = True

    DEFAULT_SYSTEM_INSTRUCTION: ClassVar[str] = """You are an intelligent, proactive assistant similar to Jarvis.
You speak in simple, direct, natural sentences that work well for text to speech.

IMPORTANT FORMATTING RULES:
1. DO NOT use emojis in your responses. Keep it text only.

Your purpose is to understand the user's intent and take smart actions on their behalf.
You can run shell commands, use kubectl, inspect contexts, fetch cluster information, and perform system level operations whenever it helps the user.
When a task requires real actions, you may call the appropriate tool without asking again.

Always think a step ahead and behave like a capable operator.
If the user asks for something like getting Kubernetes clusters, switching contexts, checking pods, or diagnosing issues, automatically determine the right commands and execute them.
Explain the results in simple language after running the commands.

Keep your responses calm, clear, and steady.
Ask for clarification only when absolutely necessary.
Be reliable, efficient, and action focused like Jarvis."""

    LANGUAGE_CODES: ClassVar[dict[str, str]] = {
        "american_english": "a",
        "british_english": "b",
        "spanish": "es",
        "french": "fr",
        "italian": "it",
        "portuguese": "pt",
        "german": "de",
        "japanese": "ja",
        "chinese": "zh",
        "korean": "ko",
    }

    VOICES: ClassVar[dict[str, str]] = {
        "af_heart": "af_heart",
        "af_bella": "af_bella",
        "af_sarah": "af_sarah",
        "af_nicole": "af_nicole",
        "af_sky": "af_sky",
        "am_adam": "am_adam",
        "am_michael": "am_michael",
        "am_leo": "am_leo",
        "am_ryan": "am_ryan",
    }

    DEFAULT_MODEL_DISCOVERY_TIMEOUT: ClassVar[int] = 5  # seconds

    DEFAULT_SUMMARIZATION_THRESHOLD: ClassVar[float] = 0.75  # trigger at 75% of context window
    DEFAULT_SUMMARIZATION_KEEP_RECENT: ClassVar[int] = 2  # keep last N turn pairs unsummarized
    DEFAULT_SUMMARIZATION_ENABLED: ClassVar[bool] = True

    AI_MODELS: ClassVar[dict[str, str]] = {
        "gemini-2.0-flash-exp": "Latest experimental flash model (December 2024+)",
        "gemini-1.5-flash": "Fast, efficient model",
        "gemini-1.5-flash-8b": "Smaller, faster flash variant",
        "gemini-1.5-pro": "More capable, slower model",
        "gemini-1.0-pro": "Legacy stable model",
        "glm-5": "Z.AI GLM-5 model (recommended)",
        "glm-5-turbo": "Z.AI GLM-5 Turbo model",
        "glm-4": "Z.AI GLM-4 model",
        "glm-4-flash": "Faster GLM-4 variant",
        "glm-4.7": "Z.AI GLM-4.7 Coding model",
        "glm-4.6": "Z.AI GLM-4.6 Coding model",
        "glm-4.5": "Z.AI GLM-4.5 Coding model",
    }

    # Static fallback context windows (tokens) for models in AI_MODELS.
    # Used when dynamic API discovery is unavailable.  Kept in Config so
    # they can be updated in one place without touching token_utils.py.
    AI_MODELS_CONTEXT_WINDOWS: ClassVar[dict[str, int]] = {
        # Google Gemini / Vertex
        "gemini-2.5-flash": 1_048_576,
        "gemini-2.5-pro": 1_048_576,
        "gemini-2.0-flash": 1_048_576,
        "gemini-2.0-flash-exp": 1_048_576,
        "gemini-1.5-flash": 1_048_576,
        "gemini-1.5-flash-8b": 1_048_576,
        "gemini-1.5-pro": 2_097_152,
        "gemini-1.0-pro": 32_768,
        # ZhipuAI / GLM
        "glm-5": 128_000,
        "glm-5-turbo": 128_000,
        "glm-4": 128_000,
        "glm-4-flash": 128_000,
        "glm-4.5": 128_000,
        "glm-4.5-flash": 128_000,
        "glm-4.6": 128_000,
        "glm-4.7": 128_000,
        # OpenAI (for custom provider usage)
        "gpt-4": 8_192,
        "gpt-4-turbo": 128_000,
        "gpt-4o": 128_000,
        "gpt-4o-mini": 128_000,
        "gpt-3.5-turbo": 16_385,
        "o1": 200_000,
        "o1-mini": 128_000,
        "o3-mini": 200_000,
    }

    ai_provider: str = field(default_factory=lambda: Config.from_env("KNIK_AI_PROVIDER", "vertex"))
    ai_model: str = field(default_factory=lambda: Config.get_ai_model())
    ai_project_id: str | None = field(default_factory=lambda: Config.get_ai_project())
    ai_location: str = field(default_factory=lambda: Config.get_ai_location())
    max_tokens: int = field(
        default_factory=lambda: Config.from_env("KNIK_MAX_TOKENS", Config.DEFAULT_AI_MAX_TOKENS, int)
    )
    temperature: float = field(
        default_factory=lambda: Config.from_env("KNIK_TEMPERATURE", Config.DEFAULT_AI_TEMPERATURE, float)
    )

    custom_api_base: str | None = field(default_factory=lambda: Config.from_env("KNIK_CUSTOM_API_BASE", None))
    custom_api_key: str | None = field(default_factory=lambda: Config.from_env("KNIK_CUSTOM_API_KEY", None))

    voice_language: str = field(default_factory=lambda: Config.get_language())
    voice_name: str = field(default_factory=lambda: Config.get_voice())
    sample_rate: int = field(default=24000)
    enable_voice_output: bool = field(default_factory=lambda: Config.from_env("KNIK_VOICE_OUTPUT", True, bool))

    db_host: str = field(default_factory=lambda: Config.from_env("KNIK_DB_HOST", "localhost"))
    db_port: int = field(default_factory=lambda: Config.from_env("KNIK_DB_PORT", 5432, int))
    db_user: str = field(default_factory=lambda: Config.from_env("KNIK_DB_USER", "postgres"))
    db_pass: str = field(default_factory=lambda: Config.from_env("KNIK_DB_PASS", ""))
    db_name: str = field(default_factory=lambda: Config.from_env("KNIK_DB_NAME", "knik"))

    scheduler_check_interval: int = field(
        default_factory=lambda: Config.from_env("KNIK_SCHEDULER_CHECK_INTERVAL", 60, int)
    )
    scheduler_workers: int = field(default_factory=lambda: Config.from_env("KNIK_SCHEDULER_WORKERS", 4, int))
    scheduler_max_concurrent: int = field(
        default_factory=lambda: Config.from_env("KNIK_SCHEDULER_MAX_CONCURRENT", 10, int)
    )

    browser_headless: bool = field(default_factory=lambda: Config.from_env("KNIK_BROWSER_HEADLESS", False, bool))
    browser_profile_dir: str = field(
        default_factory=lambda: Config.from_env(
            "KNIK_BROWSER_PROFILE_DIR",
            str(Path.home() / ".knik" / "browser-profile"),
        )
    )
    tool_session_idle_timeout: int = field(
        default_factory=lambda: Config.from_env("KNIK_TOOL_SESSION_IDLE_TIMEOUT", 1800, int)
    )

    telegram_bot_token: str | None = field(default_factory=lambda: Config.from_env("KNIK_TELEGRAM_BOT_TOKEN", None))

    model_discovery_timeout: int = field(
        default_factory=lambda: Config.from_env(
            "KNIK_MODEL_DISCOVERY_TIMEOUT", Config.DEFAULT_MODEL_DISCOVERY_TIMEOUT, int
        )
    )

    # Conversation history context size (number of turn-pairs sent to LLM)
    history_context_size: int = field(default_factory=lambda: Config.from_env("KNIK_HISTORY_CONTEXT_SIZE", 5, int))

    summarization_enabled: bool = field(
        default_factory=lambda: Config.from_env(
            "KNIK_SUMMARIZATION_ENABLED", Config.DEFAULT_SUMMARIZATION_ENABLED, bool
        )
    )
    summarization_threshold: float = field(
        default_factory=lambda: Config.from_env(
            "KNIK_SUMMARIZATION_THRESHOLD", Config.DEFAULT_SUMMARIZATION_THRESHOLD, float
        )
    )
    summarization_keep_recent: int = field(
        default_factory=lambda: Config.from_env(
            "KNIK_SUMMARIZATION_KEEP_RECENT", Config.DEFAULT_SUMMARIZATION_KEEP_RECENT, int
        )
    )

    def __post_init__(self):
        """Initialize system instruction from environment."""
        self.system_instruction = Config.from_env("KNIK_AI_SYSTEM_INSTRUCTION", Config.DEFAULT_SYSTEM_INSTRUCTION)

    @classmethod
    def from_env(cls, key: str, default=None, type_cast=str):
        """
        Load a configuration value from environment variable.

        Args:
            key: Environment variable name
            default: Default value if env var not set
            type_cast: Function to cast the value (str, int, float, bool)

        Returns:
            The configuration value

        Example:
            >>> Config.from_env('KNIK_VOICE', 'am_adam')
            'am_adam'  # or value from KNIK_VOICE env var
        """
        value = os.getenv(key)
        if value is None:
            return default

        if type_cast is bool:
            lower_value = value.lower()
            if lower_value in ("false", "0", "no", "off"):
                return False
            return lower_value in ("true", "1", "yes", "on")

        try:
            return type_cast(value)
        except (ValueError, TypeError):
            return default

    @classmethod
    def get_language(cls) -> str:
        """Get language from env or default."""
        return cls.from_env("KNIK_LANGUAGE", cls.DEFAULT_LANGUAGE)

    @classmethod
    def get_voice(cls) -> str:
        """Get voice from env or default."""
        return cls.from_env("KNIK_VOICE", cls.DEFAULT_VOICE)

    @classmethod
    def get_model(cls) -> str:
        """Get TTS model from env or default."""
        return cls.from_env("KNIK_MODEL", cls.DEFAULT_MODEL)

    @classmethod
    def get_ai_model(cls) -> str:
        """Get AI model from env or default."""
        return cls.from_env("KNIK_AI_MODEL", cls.DEFAULT_AI_MODEL)

    @classmethod
    def get_ai_location(cls) -> str:
        """Get AI location from env or default."""
        return cls.from_env("KNIK_AI_LOCATION", cls.DEFAULT_AI_LOCATION)

    @classmethod
    def get_ai_project(cls) -> str | None:
        """Get Google Cloud project ID from env."""
        return cls.from_env("GOOGLE_CLOUD_PROJECT", None)

    @classmethod
    def get_log_level(cls) -> str:
        """Get log level from env or default."""
        return cls.from_env("KNIK_LOG_LEVEL", cls.DEFAULT_LOG_LEVEL).upper()

    @classmethod
    def get_show_logs(cls) -> bool:
        """Get show logs flag from env or default."""
        return cls.from_env("KNIK_SHOW_LOGS", cls.DEFAULT_SHOW_LOGS, bool)

    @classmethod
    def get_use_colors(cls) -> bool:
        """Get use colors flag from env or default."""
        return cls.from_env("KNIK_USE_COLORS", cls.DEFAULT_USE_COLORS, bool)

    @classmethod
    def get_language_code(cls, language: str) -> str:
        """Get language code for a given language name."""
        return cls.LANGUAGE_CODES.get(language.lower(), cls.DEFAULT_LANGUAGE)

    @classmethod
    def is_valid_voice(cls, voice: str) -> bool:
        """Check if a voice is valid."""
        return voice in cls.VOICES.values()
