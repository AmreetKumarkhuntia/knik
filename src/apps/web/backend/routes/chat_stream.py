"""
Streaming Chat API endpoint with Server-Sent Events (SSE)
Streams both text and audio progressively as they're generated.

All blocking operations (AI inference, TTS, browser tools) are offloaded
to background threads so the FastAPI/uvicorn event loop stays responsive.
"""

import asyncio
import base64
import io
import json
import sys
from collections.abc import AsyncGenerator
from pathlib import Path

import soundfile as sf
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel


# Add src to path
src_path = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(src_path))

from apps.console.history import ConversationHistory
from apps.web.backend.config import WebBackendConfig
from imports import AIClient, KokoroVoiceModel, printer
from lib.mcp.index import register_all_tools
from lib.services.ai_client.registry import MCPServerRegistry


router = APIRouter()

# Configuration
config = WebBackendConfig()

# Global clients
ai_client: AIClient | None = None
tts_processor: KokoroVoiceModel | None = None
mcp_registry: MCPServerRegistry | None = None

# Global conversation history — persists for the lifetime of the server process
conversation_history = ConversationHistory(max_size=50)


class StreamChatRequest(BaseModel):
    """Streaming chat request"""

    message: str


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
                system_instruction=str(config.system_instruction) if config.system_instruction else None,
            )
            return registry, client

        mcp_registry, ai_client = await asyncio.to_thread(_build_ai)
        printer.success(f"AIClient ready: {config.ai_provider}/{config.ai_model}")

    if tts_processor is None:
        tts_processor = await asyncio.to_thread(KokoroVoiceModel)
        printer.success(f"TTS ready: {config.voice_name}")


async def stream_chat_response(prompt: str) -> AsyncGenerator[str, None]:
    """
    Stream chat response with text and audio chunks via SSE.

    Event types:
    - text: AI response text chunk
    - audio: Base64 encoded audio chunk
    - done: Streaming complete
    - error: Error occurred
    """
    try:
        await _init_clients()

        # Fetch recent history to give the AI conversation context
        history_context_size = getattr(config, "history_context_size", 5)
        history = conversation_history.get_messages(last_n=history_context_size)

        # -----------------------------------------------------------
        # Consume the synchronous AI generator on a background thread
        # and bridge chunks to the async world via an asyncio.Queue.
        # -----------------------------------------------------------
        queue: asyncio.Queue[str | None] = asyncio.Queue()
        loop = asyncio.get_running_loop()

        def _produce():
            """Iterate the sync generator and push chunks into the queue."""
            try:
                for chunk in ai_client.chat_stream(prompt=prompt, history=history):
                    loop.call_soon_threadsafe(queue.put_nowait, chunk)
            finally:
                loop.call_soon_threadsafe(queue.put_nowait, None)  # sentinel

        # Fire the producer on the default thread-pool
        producer = loop.run_in_executor(None, _produce)

        text_buffer = ""
        full_response = ""
        sentence_endings = [".", "!", "?", "\n"]
        audio_count = 0

        while True:
            text_chunk = await queue.get()
            if text_chunk is None:
                break

            # Send text chunk immediately
            yield f"event: text\ndata: {json.dumps({'text': text_chunk})}\n\n"

            full_response += text_chunk
            text_buffer += text_chunk

            # Check for complete sentences
            for ending in sentence_endings:
                if ending in text_buffer:
                    parts = text_buffer.split(ending, 1)
                    sentence = (parts[0] + ending).strip()

                    if sentence:
                        printer.info(f"Generating audio for: '{sentence[:50]}...'")
                        audio_data, sr = await asyncio.to_thread(tts_processor.generate, sentence)

                        buf = io.BytesIO()
                        sf.write(buf, audio_data, sr, format="WAV")
                        audio_b64 = base64.b64encode(buf.getvalue()).decode()

                        yield f"event: audio\ndata: {json.dumps({'audio': audio_b64, 'sample_rate': sr})}\n\n"
                        audio_count += 1
                        printer.success(f"Sent audio chunk {audio_count}")

                    text_buffer = parts[1] if len(parts) > 1 else ""
                    break

        # Wait for the producer thread to finish cleanly
        await producer

        # Process any remaining text
        if text_buffer.strip():
            printer.info(f"Generating audio for remaining: '{text_buffer[:50]}...'")
            audio_data, sr = await asyncio.to_thread(tts_processor.generate, text_buffer.strip())

            buf = io.BytesIO()
            sf.write(buf, audio_data, sr, format="WAV")
            audio_b64 = base64.b64encode(buf.getvalue()).decode()

            yield f"event: audio\ndata: {json.dumps({'audio': audio_b64, 'sample_rate': sr})}\n\n"
            audio_count += 1
            printer.success(f"Sent final audio chunk {audio_count}")

        # Save this turn to history so future messages have context
        if full_response.strip():
            conversation_history.add_entry(user_input=prompt, ai_response=full_response.strip())
            printer.info(f"Saved turn to history (total turns: {len(conversation_history.entries)})")

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
