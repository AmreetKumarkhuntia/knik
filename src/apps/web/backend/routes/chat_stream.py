"""
Streaming Chat API endpoint with Server-Sent Events (SSE)
Streams both text and audio progressively as they're generated
"""

import asyncio
import base64
import io
import json
import sys
from collections import deque
from pathlib import Path
from typing import AsyncGenerator

import soundfile as sf
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

# Add src to path
src_path = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(src_path))

from apps.web.backend.config import WebBackendConfig
from imports import AIClient, TTSAsyncProcessor, printer
from lib.mcp.index import register_all_tools
from lib.services.ai_client.registry import MCPServerRegistry


router = APIRouter()

# Configuration
config = WebBackendConfig()

# Global clients
ai_client: AIClient | None = None
tts_processor: TTSAsyncProcessor | None = None


class StreamChatRequest(BaseModel):
    """Streaming chat request"""

    message: str


async def stream_chat_response(prompt: str) -> AsyncGenerator[str, None]:
    """
    Stream chat response with text and audio chunks via SSE

    Event types:
    - text: AI response text chunk
    - audio: Base64 encoded audio chunk
    - done: Streaming complete
    - error: Error occurred
    """
    try:
        global ai_client, tts_processor

        # Initialize AI client if needed
        if ai_client is None:
            tools_count = register_all_tools(MCPServerRegistry)
            printer.info(f"Registered {tools_count} MCP tools")

            ai_client = AIClient(
                provider=config.ai_provider,
                model=config.ai_model,
                mcp_registry=MCPServerRegistry,
                project_id=config.ai_project_id,
                location=config.ai_location,
                system_instruction=config.system_instruction,
            )
            printer.success(f"AIClient ready: {config.ai_provider}/{config.ai_model}")

        # Initialize TTS processor (direct voice model usage)
        if tts_processor is None:
            from lib.services.voice_model import KokoroVoiceModel
            tts_processor = KokoroVoiceModel()
            printer.success(f"TTS ready: {config.voice_name}")

        # Stream text and audio synchronously
        text_buffer = ""
        sentence_endings = [".", "!", "?", "\n"]
        audio_count = 0

        for text_chunk in ai_client.chat_stream(prompt=prompt):
            # Send text chunk immediately
            yield f"event: text\ndata: {json.dumps({'text': text_chunk})}\n\n"

            # Buffer text for sentence detection
            text_buffer += text_chunk
            
            # Check for complete sentences
            for ending in sentence_endings:
                if ending in text_buffer:
                    parts = text_buffer.split(ending, 1)
                    sentence = (parts[0] + ending).strip()
                    
                    if sentence:
                        # Generate audio synchronously (no threading/race conditions)
                        printer.info(f"Generating audio for: '{sentence[:50]}...'")
                        audio_data, sr = tts_processor.generate(sentence)
                        
                        # Convert to WAV and encode
                        buf = io.BytesIO()
                        sf.write(buf, audio_data, sr, format="WAV")
                        audio_b64 = base64.b64encode(buf.getvalue()).decode()
                        
                        # Send audio immediately
                        yield f"event: audio\ndata: {json.dumps({'audio': audio_b64, 'sample_rate': sr})}\n\n"
                        audio_count += 1
                        printer.success(f"Sent audio chunk {audio_count}")
                    
                    # Keep remaining text in buffer
                    text_buffer = parts[1] if len(parts) > 1 else ""
                    break

        # Process any remaining text
        if text_buffer.strip():
            printer.info(f"Generating audio for remaining: '{text_buffer[:50]}...'")
            audio_data, sr = tts_processor.generate(text_buffer.strip())
            
            buf = io.BytesIO()
            sf.write(buf, audio_data, sr, format="WAV")
            audio_b64 = base64.b64encode(buf.getvalue()).decode()
            
            yield f"event: audio\ndata: {json.dumps({'audio': audio_b64, 'sample_rate': sr})}\n\n"
            audio_count += 1
            printer.success(f"Sent final audio chunk {audio_count}")

        printer.info(f"Stream complete: sent {audio_count} audio chunks")
        yield f"event: done\ndata: {json.dumps({'audio_count': audio_count})}\n\n"

    except Exception as e:
        printer.error(f"Stream error: {e}")
        yield f"event: error\ndata: {json.dumps({'error': str(e)})}\n\n"


@router.post("/")
async def stream_chat(request: StreamChatRequest):
    """
    Streaming chat endpoint using Server-Sent Events

    Returns:
        StreamingResponse with events:
        - text: Text chunks from AI
        - audio: Base64 encoded audio chunks
        - done: Streaming complete
        - error: Error message
    """
    return StreamingResponse(
        stream_chat_response(request.message),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        },
    )
