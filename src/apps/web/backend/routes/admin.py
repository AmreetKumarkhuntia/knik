"""
Admin API endpoints
Manage AI client settings and configuration
"""

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
            # Recreate AI client with updated settings
            chat_module.ai_client = AIClient(
                provider=settings.provider or config.ai_provider,
                model=settings.model or config.ai_model,
                project_id=config.ai_project_id,
                location=config.ai_location,
            )
            printer.info(
                f"AI client updated: {settings.provider or config.ai_provider}/{settings.model or config.ai_model}"
            )

        if settings.voice:
            # Recreate TTS processor with new voice
            chat_module.tts_processor = TTSAsyncProcessor(voice_model=settings.voice, sample_rate=config.sample_rate)
            printer.info(f"TTS voice updated: {settings.voice}")

        return {"status": "success", "message": "Settings updated"}

    except Exception as e:
        printer.error(f"Settings update error: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/providers")
async def list_providers():
    """List available AI providers"""
    return {
        "providers": [{"id": "vertex", "name": "Google Vertex AI"}, {"id": "mock", "name": "Mock Provider (Testing)"}]
    }


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
