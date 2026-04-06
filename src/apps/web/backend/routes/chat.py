"""Unified Chat API endpoint — text + TTS in a single request."""

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

from apps.web.backend import state
from apps.web.backend.config import WebBackendConfig
from imports import printer


router = APIRouter()

config = WebBackendConfig()


class SimpleChatRequest(BaseModel):
    """Request body for the simple (non-streaming) chat endpoint."""

    message: str
    conversation_id: str | None = None


@router.post("/")
async def chat(request: SimpleChatRequest):
    try:
        await state.init(config)

        ai_client = await state.get_or_create_ai_client(request.conversation_id)

        response_text, conversation_id, usage = await ai_client.achat(
            prompt=request.message,
            conversation_id=request.conversation_id,
            provider_meta={"provider": config.ai_provider, "model": config.ai_model},
        )

        # If achat created a new conversation_id, register this client for it
        if conversation_id and conversation_id != request.conversation_id:
            state.set_client(conversation_id, ai_client)

        audio_data, sample_rate = await asyncio.to_thread(state.tts_processor.generate, response_text)

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
