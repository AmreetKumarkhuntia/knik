"""Admin API endpoints — manage AI client settings and configuration."""

import asyncio

from fastapi import APIRouter, HTTPException

from backend import state
from backend.config import WebBackendConfig
from backend.models.admin import ApiKeyCreate, McpToolToggle, SettingsUpdate
from imports import (
    ALL_TOOL_CLASSES,
    DB_ERRORS,
    ApiKeyDB,
    Config,
    KokoroVoiceModel,
    McpToolsDB,
    ProviderRegistry,
    SettingsDB,
    printer,
)


router = APIRouter()

config = WebBackendConfig()

# Display categories for the built-in MCP tool groups.
_MCP_CATEGORY = {
    "file": "System",
    "shell": "System",
    "text": "Dev",
    "utils": "Dev",
    "cron": "Automation",
    "workflow": "Automation",
    "browser": "Web",
}


@router.get("/settings")
async def get_settings():
    """Current settings: persisted preferences merged over env/runtime defaults."""
    # Without a database this still answers with the env/runtime defaults, which are then what is in effect.
    try:
        settings = await SettingsDB.get()
    except DB_ERRORS as e:
        printer.warning(f"Persisted settings unavailable, showing defaults: {e}")
        settings = None
    persisted = settings.to_dict() if settings else {}
    temperature = persisted.get("temperature")
    return {
        "provider": persisted.get("provider") or state.get_factory_provider() or config.ai_provider,
        "model": persisted.get("model") or state.get_factory_model() or config.ai_model,
        "voice": persisted.get("voice") or config.voice_name,
        "temperature": temperature if temperature is not None else config.temperature,
        "max_tokens": persisted.get("max_tokens") or config.max_tokens,
        "sample_rate": config.sample_rate,
        "stream_responses": persisted.get("stream_responses", True),
        "send_telemetry": persisted.get("send_telemetry", False),
        "display_name": persisted.get("display_name"),
        "username": persisted.get("username"),
        "initialized": state.is_initialized(),
    }


@router.post("/settings")
async def update_settings(settings: SettingsUpdate):
    try:
        await state.init(config)

        if settings.provider or settings.model or settings.api_base or settings.api_key:
            state.update_factory_config(
                provider=settings.provider,
                model=settings.model,
                api_base=settings.api_base,
                api_key=settings.api_key,
            )
            printer.info(f"AI factory config updated: {settings.provider or 'same'}/{settings.model or 'same'}")

        if settings.voice:
            state.tts_processor = await asyncio.to_thread(KokoroVoiceModel, voice=settings.voice)
            printer.info(f"TTS voice updated: {settings.voice}")

        # Persist provided preferences so they survive restarts, then refresh the
        # in-memory overrides used the next time a client/TTS is (re)built.
        await SettingsDB.upsert(settings.model_dump(exclude_none=True))
        saved = await SettingsDB.get()
        state.set_persisted_overrides(saved.to_dict() if saved else None)

        return {"status": "success", "message": "Settings updated"}

    except DB_ERRORS:
        raise
    except Exception as e:
        printer.error(f"Settings update error: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/providers")
async def list_providers():
    provider_names = {
        "vertex": "Google Vertex AI",
        "gemini": "Google Gemini AI Studio",
        "zhipuai": "ZhipuAI (GLM)",
        "zai": "Z.AI Platform",
        "zai_coding": "Z.AI Coding Plan",
        "custom": "Custom (OpenAI-Compatible)",
        "mock": "Mock Provider (Testing)",
    }
    registered = ProviderRegistry.list_providers()
    return {"providers": [{"id": pid, "name": provider_names.get(pid, pid.title())} for pid in registered]}


@router.get("/models")
async def list_models():
    return {"models": [{"id": model_id, "name": description} for model_id, description in Config.AI_MODELS.items()]}


@router.get("/voices")
async def list_voices():
    return {
        "voices": [
            {
                "id": voice_id,
                "name": f"{voice_id.replace('_', ' ').title()} ({'Female' if voice_id.startswith('af_') else 'Male'})",
            }
            for voice_id in Config.VOICES
        ]
    }


@router.get("/mcp-tools")
async def list_mcp_tools():
    """List the built-in MCP tool groups with function counts and enabled state."""
    try:
        overrides = await McpToolsDB.get_overrides()
    except DB_ERRORS as e:
        # Every group is enabled unless overridden, so the defaults are a truthful answer.
        printer.warning(f"MCP tool overrides unavailable, showing defaults: {e}")
        overrides = {}
    tools = []
    for tool_cls in ALL_TOOL_CLASSES:
        try:
            instance = tool_cls()
            name = instance.name
            count = len(instance.get_definitions())
        except Exception as e:
            printer.debug(f"Skipping MCP tool {tool_cls.__name__}: {e}")
            continue
        tools.append(
            {
                "name": name,
                "category": _MCP_CATEGORY.get(name, "Tools"),
                "count": count,
                "enabled": overrides.get(name, True),
            }
        )
    return {"tools": tools}


@router.put("/mcp-tools/{tool_name}")
async def toggle_mcp_tool(tool_name: str, body: McpToolToggle):
    """Enable or disable a built-in MCP tool group."""
    await McpToolsDB.set_enabled(tool_name, body.enabled)
    return {"status": "success", "tool_name": tool_name, "enabled": body.enabled}


@router.get("/api-keys")
async def list_api_keys():
    """List API keys (secrets are never returned)."""
    return {"api_keys": [key.to_dict() for key in await ApiKeyDB.list_keys()]}


@router.post("/api-keys")
async def create_api_key(body: ApiKeyCreate):
    """Create an API key. The full secret is returned exactly once."""
    created = await ApiKeyDB.create(body.label, body.scopes)
    return created.to_dict()


@router.delete("/api-keys/{key_id}")
async def delete_api_key(key_id: str):
    """Revoke (delete) an API key."""
    await ApiKeyDB.delete(key_id)
    return {"status": "success", "id": key_id}
