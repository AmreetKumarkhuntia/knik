"""Configuration for Web Backend - reads from environment variables."""

from dataclasses import dataclass, field
from typing import Literal

from imports import Config, printer


ToolConsent = Literal["deny", "allow"]

# The React dev server (`npm run dev` serves it on port 8020).
DEFAULT_CORS_ORIGINS = ("http://localhost:8020", "http://127.0.0.1:8020")


def _cors_origins() -> tuple[str, ...]:
    value = Config.from_env("KNIK_WEB_CORS_ORIGINS", None)
    if value is None:
        return DEFAULT_CORS_ORIGINS
    return tuple(origin.strip() for origin in value.split(",") if origin.strip())


def _tool_consent() -> ToolConsent:
    # Anything but an explicit "allow" refuses, so a typo never runs tools unasked.
    return "allow" if Config.from_env("KNIK_WEB_TOOL_CONSENT", "deny").strip().lower() == "allow" else "deny"


def _require_api_key() -> bool:
    value = Config.from_env("KNIK_WEB_REQUIRE_API_KEY", "")
    normalized = value.strip().lower()
    if normalized in ("", "false", "0", "no", "off"):
        return False
    # Anything but a recognised "off" checks keys, so a typo never opens the API.
    if normalized not in ("true", "1", "yes", "on"):
        printer.warning(f"KNIK_WEB_REQUIRE_API_KEY={value!r} is not true or false; checking API keys")
    return True


@dataclass
class WebBackendConfig(Config):
    """Configuration for Web Backend application - extends Config."""

    host: str = field(default_factory=lambda: Config.from_env("KNIK_WEB_HOST", "0.0.0.0"))
    port: int = field(default_factory=lambda: Config.from_env("KNIK_WEB_PORT", 8010, int))
    reload: bool = field(default_factory=lambda: Config.from_env("KNIK_WEB_RELOAD", True, bool))
    # Origins whose pages may call the API from a browser; "*" lets any page in, but without credentials.
    cors_origins: tuple[str, ...] = field(default_factory=_cors_origins)
    # What web chats do with tools that need the user's approval. The web app cannot ask for it, so "deny"
    # refuses them and "allow" runs them unasked.
    tool_consent: ToolConsent = field(default_factory=_tool_consent)
    # Whether every /api route needs a stored API key in the X-API-Key header.
    require_api_key: bool = field(default_factory=_require_api_key)
