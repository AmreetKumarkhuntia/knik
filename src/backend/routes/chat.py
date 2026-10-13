"""Unified Chat API endpoint — text + TTS in a single request."""

import asyncio
import base64
import io

import soundfile as sf
from fastapi import APIRouter, HTTPException

from backend import state
from backend.config import WebBackendConfig
from backend.models.chat import SimpleChatRequest
from imports import printer


router = APIRouter()

config = WebBackendConfig()


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
