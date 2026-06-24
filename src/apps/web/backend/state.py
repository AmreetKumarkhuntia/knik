"""Shared mutable state for the web backend.

Replaces the module-level globals in chat.py and chat_stream.py.
All route modules import from here instead of owning their own singletons.
"""

from __future__ import annotations

import asyncio
from dataclasses import dataclass

from imports import AIClient, KokoroVoiceModel, printer
from lib.mcp.index import register_all_tools
from lib.services.ai_client.client_cache import AIClientCache
from lib.services.ai_client.registry import MCPServerRegistry


@dataclass
class _FactoryConfig:
    provider: str
    model: str
    project_id: str | None
    location: str | None
    system_instruction: str | None
    api_base: str | None = None
    api_key: str | None = None


conversation_clients: AIClientCache = AIClientCache()
tts_processor: KokoroVoiceModel | None = None

_factory_config: _FactoryConfig | None = None
_init_lock: asyncio.Lock | None = None

# Persisted settings (provider/model/voice/api_base/api_key) loaded from the DB at
# startup and applied the first time the factory config / TTS are built.
_persisted_overrides: dict | None = None


def set_persisted_overrides(overrides: dict | None) -> None:
    """Record persisted settings to apply on first init (called from startup)."""
    global _persisted_overrides
    _persisted_overrides = overrides or None


def _get_init_lock() -> asyncio.Lock:
    global _init_lock
    if _init_lock is None:
        _init_lock = asyncio.Lock()
    return _init_lock


def _build_client(cfg: _FactoryConfig) -> tuple[MCPServerRegistry, AIClient]:
    registry = MCPServerRegistry()
    register_all_tools(registry)
    kwargs: dict = {
        "provider": cfg.provider,
        "model": cfg.model,
        "mcp_registry": registry,
        "system_instruction": cfg.system_instruction,
    }
    if cfg.project_id:
        kwargs["project_id"] = cfg.project_id
    if cfg.location:
        kwargs["location"] = cfg.location
    if cfg.api_base:
        kwargs["api_base"] = cfg.api_base
    if cfg.api_key:
        kwargs["api_key"] = cfg.api_key
    client = AIClient(**kwargs)
    return registry, client


async def init(cfg_source) -> None:
    global tts_processor, _factory_config

    overrides = _persisted_overrides or {}

    async with _get_init_lock():
        if _factory_config is None:
            _factory_config = _FactoryConfig(
                provider=overrides.get("provider") or cfg_source.ai_provider,
                model=overrides.get("model") or cfg_source.ai_model,
                project_id=cfg_source.ai_project_id,
                location=cfg_source.ai_location,
                system_instruction=str(cfg_source.system_instruction) if cfg_source.system_instruction else None,
                api_base=overrides.get("api_base"),
                api_key=overrides.get("api_key"),
            )

        if tts_processor is None:
            voice = overrides.get("voice") or cfg_source.voice_name
            tts_processor = await asyncio.to_thread(KokoroVoiceModel, voice=voice)
            printer.success(f"TTS ready: {voice}")


async def get_or_create_ai_client(conversation_id: str | None) -> AIClient:
    """A None conversation_id still gets a fresh client (the achat lifecycle
    will create a real conversation_id and the caller should cache-update
    using set_client() once the id is known.
    """
    if conversation_id is not None:
        cached = conversation_clients.get(conversation_id)
        if cached is not None:
            return cached

    cfg = _factory_config
    if cfg is None:
        raise RuntimeError("state.init() must be called before get_or_create_ai_client()")

    _registry, client = await asyncio.to_thread(_build_client, cfg)
    printer.success(f"AIClient ready: {cfg.provider}/{cfg.model}")

    if conversation_id is not None:
        conversation_clients.set(conversation_id, client)

    return client


def set_client(conversation_id: str, client: AIClient) -> None:
    conversation_clients.set(conversation_id, client)


def update_factory_config(
    *,
    provider: str | None = None,
    model: str | None = None,
    api_base: str | None = None,
    api_key: str | None = None,
) -> None:
    """Clears the entire client cache so subsequent requests get fresh clients
    built with the new config.  Existing in-flight requests are unaffected.
    """
    global _factory_config, conversation_clients

    if _factory_config is None:
        raise RuntimeError("state.init() must be called before update_factory_config()")

    _factory_config = _FactoryConfig(
        provider=provider or _factory_config.provider,
        model=model or _factory_config.model,
        project_id=_factory_config.project_id,
        location=_factory_config.location,
        system_instruction=_factory_config.system_instruction,
        api_base=api_base if api_base is not None else _factory_config.api_base,
        api_key=api_key if api_key is not None else _factory_config.api_key,
    )
    conversation_clients = AIClientCache()


def get_factory_provider() -> str | None:
    return _factory_config.provider if _factory_config else None


def get_factory_model() -> str | None:
    return _factory_config.model if _factory_config else None


def is_initialized() -> bool:
    return _factory_config is not None
