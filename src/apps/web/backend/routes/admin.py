"""Admin API endpoints — manage AI client settings and configuration."""

import asyncio
import sys
from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel


src_path = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(src_path))

from apps.web.backend import state
from apps.web.backend.config import WebBackendConfig
from imports import KokoroVoiceModel, printer
from lib.core.config import Config
from lib.services.ai_client.registry import ProviderRegistry


router = APIRouter()

config = WebBackendConfig()


class SettingsUpdate(BaseModel):
    provider: str | None = None
    model: str | None = None
    voice: str | None = None
    api_base: str | None = None
    api_key: str | None = None


@router.get("/settings")
async def get_settings():
    return {
        "provider": state.get_factory_provider() or config.ai_provider,
        "model": state.get_factory_model() or config.ai_model,
        "voice": config.voice_name,
        "temperature": config.temperature,
        "max_tokens": config.max_tokens,
        "sample_rate": config.sample_rate,
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
