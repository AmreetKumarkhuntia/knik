"""Unified Chat API endpoint — text + TTS in a single request."""

import asyncio
import base64
import io

import soundfile as sf
from fastapi import APIRouter, Depends, HTTPException

from backend.deps import get_state
from backend.models.chat import ChatRequest
from backend.routes.conversations import SOURCE, chat_conversation_id
from backend.state import AppState
from imports import printer


router = APIRouter()


@router.post("/")
async def chat(request: ChatRequest, state: AppState = Depends(get_state)):
    requested_id = await chat_conversation_id(request.conversation_id)
    try:
        config = state.config
        async with state.client(requested_id) as ai_client:
            response_text, conversation_id, usage = await ai_client.achat(
                prompt=request.message,
                conversation_id=requested_id,
                source=SOURCE,
                provider_meta={"provider": config.ai_provider, "model": config.ai_model},
            )

            # If achat created a new conversation_id, register this client for it
            if conversation_id and conversation_id != requested_id:
                state.set_client(conversation_id, ai_client)

        audio_data, sample_rate = await asyncio.to_thread(state.tts.generate, response_text)

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
