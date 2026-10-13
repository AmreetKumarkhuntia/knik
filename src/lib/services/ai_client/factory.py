"""The one place an AIClient is built from settings, so every app configures providers the same way."""

from .client import AIClient
from .settings import ClientSettings, provider_kwargs
from .tool_provider import ToolProvider


__all__ = ["ClientSettings", "build_client", "provider_kwargs"]


def build_client(settings: ClientSettings, *, tool_registry: ToolProvider | None = None) -> AIClient:
    return AIClient(
        provider=settings.provider,
        tool_registry=tool_registry,
        system_instruction=settings.system_instruction,
        settings=settings,
        **provider_kwargs(settings),
    )
