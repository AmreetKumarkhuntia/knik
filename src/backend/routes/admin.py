"""Admin API endpoints — manage AI client settings and configuration."""

from fastapi import APIRouter, Depends, HTTPException

from backend.deps import get_state
from backend.models.admin import ApiKeyCreate, McpToolToggle, SettingsUpdate
from backend.state import AppState
from imports import DB_ERRORS, ApiKeyDB, Config, ProviderRegistry, printer


router = APIRouter()


@router.get("/settings")
async def get_settings(state: AppState = Depends(get_state)):
    """Current settings: persisted preferences merged over the values in effect and the env defaults."""
    return await state.settings.view()


@router.post("/settings")
async def update_settings(settings: SettingsUpdate, state: AppState = Depends(get_state)):
    """Persist the given preferences and apply them: new chats use the new AI settings, TTS the new voice."""
    try:
        await state.update_settings(settings)
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
async def list_mcp_tools(state: AppState = Depends(get_state)):
    """List the built-in MCP tool groups with function counts and enabled state."""
    return {"tools": await state.settings.tool_groups()}


@router.put("/mcp-tools/{tool_name}")
async def toggle_mcp_tool(tool_name: str, body: McpToolToggle, state: AppState = Depends(get_state)):
    """Enable or disable a built-in MCP tool group, for every chat from its next message on."""
    await state.set_tool_group_enabled(tool_name, body.enabled)
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
