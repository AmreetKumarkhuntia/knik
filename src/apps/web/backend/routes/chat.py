"""
Unified Chat API endpoint
Handles AI chat + TTS in a single request
"""

import base64
import io
import sys
from pathlib import Path

import soundfile as sf
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel


# Add src to path
src_path = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(src_path))

from apps.web.backend.config import WebBackendConfig
from imports import AIClient, TTSAsyncProcessor, printer


router = APIRouter()

# Configuration
config = WebBackendConfig()

# Global clients
ai_client: AIClient | None = None
tts_processor: TTSAsyncProcessor | None = None


class SimpleChatRequest(BaseModel):
    """Simple chat request - just text"""

    message: str


@router.post("/")
async def chat(request: SimpleChatRequest):
    """
    Unified chat endpoint: Send text, get back text + audio

    Request: {"message": "Hello"}
    Response: {"text": "Hi there!", "audio": "base64...", "sample_rate": 24000}
    """
    try:
        global ai_client, tts_processor

        # Initialize clients if needed (using config from environment)
        if ai_client is None:
            ai_client = AIClient(
                provider=config.ai_provider,
                model=config.ai_model,
                project_id=config.ai_project_id,
                location=config.ai_location,
            )
            printer.info(f"AIClient initialized: {config.ai_provider}/{config.ai_model}")

        if tts_processor is None:
            tts_processor = TTSAsyncProcessor(voice_model=config.voice_name, sample_rate=config.sample_rate)
            printer.info(f"TTSProcessor initialized: {config.voice_name}@{config.sample_rate}Hz")

        # Get AI response
        response_text = ai_client.query(prompt=request.message)

        # Generate audio using the Kokoro voice model
        audio_data, sample_rate = tts_processor.tts_processor.generate(response_text)

        # Convert to WAV bytes
        buffer = io.BytesIO()
        sf.write(buffer, audio_data, sample_rate, format="WAV")
        audio_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

        return {"text": response_text, "audio": audio_base64, "sample_rate": config.sample_rate}

    except Exception as e:
        printer.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e
