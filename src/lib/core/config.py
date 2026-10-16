"""Application settings: one ``setting()`` field per key, read from env, with stored overrides layered on top.

A field with ``user=True`` is a setting people may change at runtime: ``schema()`` describes it, ``coerce()``
checks a value for it, ``with_overrides()`` applies stored values over the env ones, and ``install()`` makes
the result the ``current()`` config for the process. Adding a setting is adding one field.
"""

import os
import warnings
from collections.abc import Mapping
from dataclasses import Field, dataclass, field, fields, replace
from pathlib import Path
from types import NoneType
from typing import Any, ClassVar, Self, get_args, get_type_hints

from dotenv import load_dotenv


_ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent
_ENV_PATH = _ROOT_DIR / ".env"
if _ENV_PATH.exists():
    load_dotenv(dotenv_path=_ENV_PATH)
else:
    load_dotenv()


_SCHEMA_KEYS = ("env", "default", "label", "description", "options", "secret", "group")


def setting(
    env: str,
    default: Any,
    cast: type = str,
    *,
    user: bool = False,
    secret: bool = False,
    label: str = "",
    description: str = "",
    options: list[Any] | None = None,
    group: str = "",
) -> Any:
    """A Config field read from ``env``, else ``default``. ``user=True`` makes it a setting users may override."""
    return field(
        default_factory=lambda: Config.from_env(env, default, cast),
        metadata={
            "env": env,
            "default": default,
            "user": user,
            "secret": secret,
            "label": label,
            "description": description,
            "options": options,
            "group": group,
        },
    )


def _kind(hint: Any) -> type:
    """The setting's type with ``None`` stripped: a ``str | None`` field is a ``str`` setting."""
    return next(t for t in (get_args(hint) or (hint,)) if t is not NoneType)


@dataclass
class Config:
    _current: ClassVar["Config | None"] = None

    SAMPLE_RATE: ClassVar[int] = 24000

    DEFAULT_TTS: ClassVar[str] = "kokoro"
    DEFAULT_LANGUAGE: ClassVar[str] = "a"
    DEFAULT_VOICE: ClassVar[str] = "af_heart"
    DEFAULT_MODEL: ClassVar[str] = "hexgrad/Kokoro-82M"

    DEFAULT_AI_MODEL: ClassVar[str] = "gemini-1.5-flash"
    DEFAULT_AI_LOCATION: ClassVar[str] = "us-central1"
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

    DEFAULT_COMPACTION_THRESHOLD: ClassVar[float] = 0.95  # trigger at 95% of context window
    DEFAULT_COMPACTION_ENABLED: ClassVar[bool] = True
    DEFAULT_COMPACTION_CIRCUIT_BREAKER: ClassVar[int] = 3  # stop after N consecutive failures
    DEFAULT_COMPACTION_PROMPT_BUFFER: ClassVar[int] = 1024  # tokens reserved for summary output

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

    ai_provider: str = setting("KNIK_AI_PROVIDER", "vertex", user=True, label="Provider", group="AI")
    ai_model: str = setting("KNIK_AI_MODEL", DEFAULT_AI_MODEL, user=True, label="Model", group="AI")
    ai_project_id: str | None = setting("GOOGLE_CLOUD_PROJECT", None)
    ai_location: str = setting("KNIK_AI_LOCATION", DEFAULT_AI_LOCATION)
    temperature: float = setting(
        "KNIK_TEMPERATURE", DEFAULT_AI_TEMPERATURE, float, user=True, label="Temperature", group="AI"
    )
    max_tokens: int | None = setting(
        "KNIK_MAX_TOKENS",
        None,
        int,
        user=True,
        label="Max output tokens",
        group="AI",
        description="Empty leaves the provider's own limit.",
    )
    system_instruction: str = setting(
        "KNIK_AI_SYSTEM_INSTRUCTION", DEFAULT_SYSTEM_INSTRUCTION, user=True, label="System instruction", group="AI"
    )
    custom_api_base: str | None = setting(
        "KNIK_CUSTOM_API_BASE",
        None,
        user=True,
        label="Custom API base URL",
        group="AI",
        description="For the custom (OpenAI-compatible) provider.",
    )
    custom_api_key: str | None = setting(
        "KNIK_CUSTOM_API_KEY", None, user=True, secret=True, label="Custom API key", group="AI"
    )

    voice_language: str = setting("KNIK_LANGUAGE", DEFAULT_LANGUAGE)
    voice_name: str = setting(
        "KNIK_VOICE", DEFAULT_VOICE, user=True, label="Voice", group="Voice", options=list(VOICES)
    )
    sample_rate: int = 24000
    enable_voice_output: bool = setting(
        "KNIK_VOICE_OUTPUT", True, bool, user=True, label="Speak replies", group="Voice"
    )

    db_host: str = setting("KNIK_DB_HOST", "localhost")
    db_port: int = setting("KNIK_DB_PORT", 5432, int)
    db_user: str = setting("KNIK_DB_USER", "postgres")
    db_pass: str = setting("KNIK_DB_PASS", "")
    db_name: str = setting("KNIK_DB_NAME", "knik")
    db_pool_min_size: int = setting("KNIK_DB_POOL_MIN_SIZE", 1, int)
    db_pool_max_size: int = setting("KNIK_DB_POOL_MAX_SIZE", 10, int)
    db_connect_timeout: float = setting("KNIK_DB_CONNECT_TIMEOUT", 5.0, float)

    scheduler_check_interval: int = setting("KNIK_SCHEDULER_CHECK_INTERVAL", 60, int)
    scheduler_workers: int = setting("KNIK_SCHEDULER_WORKERS", 4, int)
    scheduler_max_concurrent: int = setting("KNIK_SCHEDULER_MAX_CONCURRENT", 10, int)
    scheduler_stale_execution_seconds: int = setting("KNIK_SCHEDULER_STALE_EXECUTION_SECONDS", 3600, int)

    browser_headless: bool = setting(
        "KNIK_BROWSER_HEADLESS", False, bool, user=True, label="Headless browser", group="Browser"
    )
    browser_profile_dir: str = setting("KNIK_BROWSER_PROFILE_DIR", str(Path.home() / ".knik" / "browser-profile"))
    browser_idle_timeout: int = setting(
        "KNIK_BROWSER_IDLE_TIMEOUT", 1800, int, user=True, label="Browser idle timeout (seconds)", group="Browser"
    )
    telegram_bot_token: str | None = setting("KNIK_TELEGRAM_BOT_TOKEN", None)

    model_discovery_timeout: int = setting("KNIK_MODEL_DISCOVERY_TIMEOUT", DEFAULT_MODEL_DISCOVERY_TIMEOUT, int)

    history_context_size: int = setting(
        "KNIK_HISTORY_CONTEXT_SIZE",
        5,
        int,
        user=True,
        label="History turns sent to the model",
        group="Conversation",
    )
    compaction_enabled: bool = setting(
        "KNIK_COMPACTION_ENABLED",
        DEFAULT_COMPACTION_ENABLED,
        bool,
        user=True,
        label="Compact long conversations",
        group="Conversation",
    )
    compaction_threshold: float = setting(
        "KNIK_COMPACTION_THRESHOLD",
        DEFAULT_COMPACTION_THRESHOLD,
        float,
        user=True,
        label="Compaction threshold",
        group="Conversation",
        description="Share of the context window that triggers a summary.",
    )
    compaction_circuit_breaker: int = setting(
        "KNIK_COMPACTION_CIRCUIT_BREAKER",
        DEFAULT_COMPACTION_CIRCUIT_BREAKER,
        int,
        user=True,
        label="Compaction failures before giving up",
        group="Conversation",
    )
    compaction_prompt_buffer: int = setting(
        "KNIK_COMPACTION_PROMPT_BUFFER",
        DEFAULT_COMPACTION_PROMPT_BUFFER,
        int,
        user=True,
        label="Tokens reserved for the summary",
        group="Conversation",
    )

    display_name: str | None = setting("KNIK_DISPLAY_NAME", None, user=True, label="Display name", group="Profile")
    username: str | None = setting("KNIK_USERNAME", None, user=True, label="Username", group="Profile")
    stream_responses: bool = setting(
        "KNIK_STREAM_RESPONSES", True, bool, user=True, label="Stream responses", group="UI"
    )
    send_telemetry: bool = setting("KNIK_SEND_TELEMETRY", False, bool, user=True, label="Send telemetry", group="UI")

    @classmethod
    def install(cls, config: "Config") -> None:
        """Make ``config`` the one ``current()`` returns for the rest of this process."""
        Config._current = config

    @classmethod
    def current(cls) -> "Config":
        """The config the app installed (env layered with its stored settings), else a fresh env config."""
        return Config._current if Config._current is not None else cls()

    @classmethod
    def schema(cls) -> list[dict[str, Any]]:
        """One definition per user setting: key, type, env, default, label, description, options, secret, group."""
        hints = get_type_hints(cls)
        return [
            {"key": f.name, "type": _kind(hints[f.name]).__name__, **{k: f.metadata[k] for k in _SCHEMA_KEYS}}
            for f in cls._user_fields().values()
        ]

    @classmethod
    def coerce(cls, key: str, value: Any) -> Any:
        """``value`` as the setting's type; ValueError for an unknown setting, a wrong type or a value outside its options."""
        f = cls._user_fields().get(key)
        if f is None:
            raise ValueError(f"unknown setting {key!r}")
        hint = get_type_hints(cls)[key]
        kind = _kind(hint)
        if value is None:
            if NoneType in get_args(hint):
                return None
            raise ValueError(f"{key} cannot be empty")
        # bool is an int in Python, so it needs its own check; an int is fine where a float is expected.
        accepted = (int, float) if kind is float else (kind,)
        if isinstance(value, bool) is not (kind is bool) or not isinstance(value, accepted):
            raise ValueError(f"{key} must be {kind.__name__}")
        options = f.metadata["options"]
        if options and value not in options:
            raise ValueError(f"{key} must be one of {', '.join(map(str, options))}")
        return kind(value)

    @classmethod
    def validate(cls, overrides: Mapping[str, Any]) -> dict[str, Any]:
        """Every override coerced to its setting's type; ValueError on the first one that is not valid."""
        return {key: cls.coerce(key, value) for key, value in overrides.items()}

    def with_overrides(self, overrides: Mapping[str, Any]) -> Self:
        """A copy with the valid overrides applied.

        An invalid one, such as a stored key whose field has since been removed, is skipped with a warning
        rather than failing startup.
        """
        accepted = {}
        for key, value in overrides.items():
            try:
                accepted[key] = self.coerce(key, value)
            except ValueError as e:
                warnings.warn(f"Ignoring setting: {e}", stacklevel=2)
        return replace(self, **accepted)

    @classmethod
    def _user_fields(cls) -> dict[str, Field[Any]]:
        return {f.name: f for f in fields(cls) if f.metadata.get("user")}

    @classmethod
    def from_env(cls, key: str, default=None, type_cast=str):
        """
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
    def get_log_level(cls) -> str:
        return cls.from_env("KNIK_LOG_LEVEL", cls.DEFAULT_LOG_LEVEL).upper()

    @classmethod
    def get_show_logs(cls) -> bool:
        return cls.from_env("KNIK_SHOW_LOGS", cls.DEFAULT_SHOW_LOGS, bool)

    @classmethod
    def get_use_colors(cls) -> bool:
        return cls.from_env("KNIK_USE_COLORS", cls.DEFAULT_USE_COLORS, bool)

    @classmethod
    def get_language_code(cls, language: str) -> str:
        return cls.LANGUAGE_CODES.get(language.lower(), cls.DEFAULT_LANGUAGE)

    @classmethod
    def is_valid_voice(cls, voice: str) -> bool:
        return voice in cls.VOICES.values()
