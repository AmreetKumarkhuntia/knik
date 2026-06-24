"""Admin API endpoints — manage AI client settings and configuration."""

import asyncio
import sys
from pathlib import Path

from fastapi import APIRouter, HTTPException


src_path = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(src_path))

from apps.web.backend import state
from apps.web.backend.config import WebBackendConfig
from apps.web.backend.models.admin import ApiKeyCreate, McpToolToggle, SettingsUpdate
from imports import KokoroVoiceModel, printer
from lib.core.config import Config
from lib.mcp.tools import ALL_TOOL_CLASSES
from lib.services.ai_client.registry import ProviderRegistry
from lib.services.settings import ApiKeyDB, McpToolsDB, SettingsDB


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
    persisted = await SettingsDB.get() or {}
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
        state.set_persisted_overrides(await SettingsDB.get())

        return {"status": "success", "message": "Settings updated"}

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
    overrides = await McpToolsDB.get_overrides()
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
    return {"api_keys": await ApiKeyDB.list_keys()}


@router.post("/api-keys")
async def create_api_key(body: ApiKeyCreate):
    """Create an API key. The full secret is returned exactly once."""
    result = await ApiKeyDB.create(body.label, body.scopes)
    if result is None:
        raise HTTPException(status_code=500, detail="Failed to create API key")
    return result


@router.delete("/api-keys/{key_id}")
async def delete_api_key(key_id: str):
    """Revoke (delete) an API key."""
    await ApiKeyDB.delete(key_id)
    return {"status": "success", "id": key_id}
