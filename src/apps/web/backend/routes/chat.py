"""
Unified Chat API endpoint
Handles AI chat + TTS in a single request.

The route is a thin orchestrator: AI lifecycle (persistence, history,
summarisation) is handled by ``AIClient.achat``; this module only deals
with web-specific concerns (TTS audio encoding, response formatting).
"""

import asyncio
import base64
import io
import sys
from pathlib import Path

import soundfile as sf
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel


src_path = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(src_path))

from apps.web.backend.config import WebBackendConfig
from imports import AIClient, TTSAsyncProcessor, printer
from lib.mcp.index import register_all_tools
from lib.services.ai_client.registry import MCPServerRegistry


router = APIRouter()

config = WebBackendConfig()

ai_client: AIClient | None = None
tts_processor: TTSAsyncProcessor | None = None
mcp_registry: MCPServerRegistry | None = None


class SimpleChatRequest(BaseModel):
    message: str
    conversation_id: str | None = None


async def _init_clients():
    """Lazily initialise the AI client and TTS processor (off the event loop)."""
    global ai_client, tts_processor, mcp_registry

    if ai_client is None:

        def _build_ai():
            registry = MCPServerRegistry()
            register_all_tools(registry)
            client = AIClient(
                provider=config.ai_provider,
                model=config.ai_model,
                mcp_registry=registry,
                project_id=config.ai_project_id,
                location=config.ai_location,
                system_instruction=config.system_instruction,
            )
            return registry, client

        mcp_registry, ai_client = await asyncio.to_thread(_build_ai)
        printer.success(f"AIClient ready: {config.ai_provider}/{config.ai_model}")

    if tts_processor is None:
        tts_processor = await asyncio.to_thread(
            TTSAsyncProcessor, voice_model=config.voice_name, sample_rate=config.sample_rate
        )
        printer.success(f"TTS ready: {config.voice_name}")


@router.post("/")
async def chat(request: SimpleChatRequest):
    """
    Unified chat endpoint: Send text, get back text + audio

    Request: {"message": "Hello", "conversation_id": "optional-uuid"}
    Response: {"text": "Hi there!", "audio": "base64...", "sample_rate": 24000, "conversation_id": "uuid"}
    """
    try:
        await _init_clients()

        response_text, conversation_id, usage = await ai_client.achat(
            prompt=request.message,
            conversation_id=request.conversation_id,
            provider_meta={"provider": config.ai_provider, "model": config.ai_model},
        )

        audio_data, sample_rate = await asyncio.to_thread(tts_processor.tts_processor.generate, response_text)

        buffer = io.BytesIO()
        sf.write(buffer, audio_data, sample_rate, format="WAV")
        audio_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

        response = {
            "text": response_text,
            "audio": audio_base64,
            "sample_rate": config.sample_rate,
            "conversation_id": conversation_id,
        }

        if usage:
            response["usage"] = usage

        return response

    except Exception as e:
        printer.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e
