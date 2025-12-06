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

        printer.info("=" * 80)
        printer.info(f"📨 Received chat request: '{request.message[:50]}{'...' if len(request.message) > 50 else ''}'")

        # Initialize clients if needed (using config from environment)
        if ai_client is None:
            printer.info("🔧 Initializing AIClient...")
            ai_client = AIClient(
                provider=config.ai_provider,
                model=config.ai_model,
                project_id=config.ai_project_id,
                location=config.ai_location,
                system_instruction=config.system_instruction,
            )
            printer.success(f"✅ AIClient ready: {config.ai_provider}/{config.ai_model}")

        if tts_processor is None:
            printer.info("🔧 Initializing TTSProcessor...")
            tts_processor = TTSAsyncProcessor(voice_model=config.voice_name, sample_rate=config.sample_rate)
            printer.success(f"✅ TTSProcessor ready: {config.voice_name}@{config.sample_rate}Hz")

        # Get AI response
        printer.info(f"🤖 Querying AI ({config.ai_model})...")
        response_text = ai_client.query(prompt=request.message)
        printer.success(f"✅ AI response received ({len(response_text)} chars)")
        printer.info(f"💬 Response preview: '{response_text[:100]}{'...' if len(response_text) > 100 else ''}'")

        # Generate audio using the Kokoro voice model
        printer.info(f"🎤 Generating speech ({config.voice_name})...")
        audio_data, sample_rate = tts_processor.tts_processor.generate(response_text)
        audio_duration = len(audio_data) / sample_rate
        printer.success(f"✅ Audio generated: {audio_duration:.2f}s @ {sample_rate}Hz")

        # Convert to WAV bytes
        printer.info("📦 Encoding audio to base64...")
        buffer = io.BytesIO()
        sf.write(buffer, audio_data, sample_rate, format="WAV")
        audio_bytes = buffer.getvalue()
        audio_base64 = base64.b64encode(audio_bytes).decode("utf-8")
        audio_size_kb = len(audio_bytes) / 1024
        printer.success(f"✅ Audio encoded: {audio_size_kb:.1f} KB")

        printer.success("🎉 Chat request completed successfully!")
        printer.info("=" * 80)

        return {"text": response_text, "audio": audio_base64, "sample_rate": config.sample_rate}

    except Exception as e:
        printer.error("=" * 80)
        printer.error(f"❌ Chat error: {e}")
        printer.error("=" * 80)
        raise HTTPException(status_code=500, detail=str(e)) from e
