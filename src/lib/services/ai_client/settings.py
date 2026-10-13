"""What an AIClient is built from, and which of those settings each provider accepts."""

import inspect
from dataclasses import dataclass
from typing import Any

from .registry import ProviderRegistry


@dataclass(frozen=True)
class ClientSettings:
    provider: str
    model: str | None = None
    system_instruction: str | None = None
    project_id: str | None = None
    location: str | None = None
    api_base: str | None = None
    api_key: str | None = None
    temperature: float | None = None
    max_tokens: int | None = None


def provider_kwargs(settings: ClientSettings) -> dict[str, Any]:
    """The settings that are set and that the provider's constructor declares, with the model as ``model_name``.

    Providers disagree on the model argument: Vertex only reports ``model_name`` (a ``model`` reaches the LLM
    but get_info() keeps the default), the GLM, Z.AI and Gemini providers let ``model`` override it, and mock
    takes neither. Most also forward unknown keyword arguments straight to their LangChain class, where a
    stray ``api_key`` collides with the one they pass themselves. So only a declared parameter is passed on.
    """
    values = {
        "model_name": settings.model,
        "project_id": settings.project_id,
        "location": settings.location,
        "api_base": settings.api_base,
        "api_key": settings.api_key,
        "temperature": settings.temperature,
        "max_tokens": settings.max_tokens,
    }
    accepted = _constructor_parameters(settings.provider)
    return {name: value for name, value in values.items() if value is not None and name in accepted}


def _constructor_parameters(provider: str) -> frozenset[str]:
    provider_class = ProviderRegistry.get(provider)
    if provider_class is None:
        return frozenset()
    return frozenset(inspect.signature(provider_class.__init__).parameters)
