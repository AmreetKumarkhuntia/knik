"""Admin API endpoints — manage AI client settings and configuration."""

from typing import Any

from fastapi import APIRouter, Depends, HTTPException

from backend.deps import get_state
from backend.models.admin import ApiKeyCreate, McpToolToggle
from backend.state import AppState
from imports import ApiKeyDB


router = APIRouter()


@router.get("/settings")
async def get_settings(state: AppState = Depends(get_state)):
    """Every user setting with its definition, the value in effect and where it comes from (db, env or default)."""
    return state.settings.view()


@router.post("/settings")
async def update_settings(changes: dict[str, Any], state: AppState = Depends(get_state)):
    """Persist the given settings and apply them: new chats use the new AI settings, TTS the new voice."""
    try:
        await state.update_settings(changes)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e)) from e
    return {"status": "success", "message": "Settings updated"}


@router.delete("/settings/{key}")
async def reset_setting(key: str, state: AppState = Depends(get_state)):
    """Forget the stored value; the env or built-in default applies again."""
    await state.reset_setting(key)
    return {"status": "success", "key": key}


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
