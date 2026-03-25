"""
Admin API endpoints
Manage AI client settings and configuration.

Heavy constructors (AIClient, TTSAsyncProcessor) are offloaded to
background threads via asyncio.to_thread so the event loop stays responsive.
"""

import asyncio
import sys
from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel


# Add src to path
src_path = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(src_path))

from apps.web.backend.config import WebBackendConfig
from imports import AIClient, TTSAsyncProcessor, printer


router = APIRouter()

# Import the global client from chat route
from apps.web.backend.routes import chat as chat_module


# Configuration
config = WebBackendConfig()


class SettingsUpdate(BaseModel):
    """Update AI settings"""

    provider: str | None = None
    model: str | None = None
    voice: str | None = None
    api_base: str | None = None  # Custom provider: OpenAI-compatible API base URL
    api_key: str | None = None  # Custom provider: API key (optional for local servers)


@router.get("/settings")
async def get_settings():
    """Get current AI settings from config and running clients"""
    return {
        "provider": config.ai_provider,
        "model": config.ai_model,
        "voice": config.voice_name,
        "temperature": config.temperature,
        "max_tokens": config.max_tokens,
        "sample_rate": config.sample_rate,
        "initialized": chat_module.ai_client is not None,
    }


@router.post("/settings")
async def update_settings(settings: SettingsUpdate):
    """Update AI client settings (recreates client with new config)"""
    try:
        if settings.provider or settings.model:
            # Build provider-specific kwargs
            provider_kwargs = {
                "model": settings.model or config.ai_model,
                "mcp_registry": chat_module.mcp_registry,
                "project_id": config.ai_project_id,
                "location": config.ai_location,
                "system_instruction": config.system_instruction,
            }

            # Forward custom provider fields if applicable
            target_provider = settings.provider or config.ai_provider
            if target_provider == "custom":
                if settings.api_base:
                    provider_kwargs["api_base"] = settings.api_base
                if settings.api_key:
                    provider_kwargs["api_key"] = settings.api_key

            # Recreate AI client with updated settings (offloaded — may connect to API)
            chat_module.ai_client = await asyncio.to_thread(
                AIClient,
                provider=target_provider,
                **provider_kwargs,
            )
            printer.info(f"AI client updated: {target_provider}/{settings.model or config.ai_model}")

        if settings.voice:
            # Recreate TTS processor with new voice (offloaded — may load PyTorch model)
            chat_module.tts_processor = await asyncio.to_thread(
                TTSAsyncProcessor, voice_model=settings.voice, sample_rate=config.sample_rate
            )
            printer.info(f"TTS voice updated: {settings.voice}")

        return {"status": "success", "message": "Settings updated"}

    except Exception as e:
        printer.error(f"Settings update error: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/providers")
async def list_providers():
    """List available AI providers"""
    from lib.services.ai_client.registry import ProviderRegistry as Registry

    provider_names = {
        "vertex": "Google Vertex AI",
        "gemini": "Google Gemini AI Studio",
        "zhipuai": "ZhipuAI (GLM)",
        "zai": "Z.AI Platform",
        "zai_coding": "Z.AI Coding Plan",
        "custom": "Custom (OpenAI-Compatible)",
        "mock": "Mock Provider (Testing)",
    }
    registered = Registry.list_providers()
    return {"providers": [{"id": pid, "name": provider_names.get(pid, pid.title())} for pid in registered]}


@router.get("/models")
async def list_models():
    """List available AI models"""
    from lib.core.config import Config

    return {"models": [{"id": model_id, "name": description} for model_id, description in Config.AI_MODELS.items()]}


@router.get("/voices")
async def list_voices():
    """List available TTS voices from config"""
    from lib.core.config import Config

    return {
        "voices": [
            {
                "id": voice_id,
                "name": f"{voice_id.replace('_', ' ').title()} ({'Female' if voice_id.startswith('af_') else 'Male'})",
            }
            for voice_id in Config.VOICES
        ]
    }
