"""
Streaming Chat API endpoint with Server-Sent Events (SSE)
Streams both text and audio progressively as they're generated.

Text is streamed to the client as soon as it arrives from the LLM.
Audio generation runs in a **background task** and is completely
independent of text delivery — a TTS failure for one sentence never
blocks or kills the text stream.

The route is a thin orchestrator: AI lifecycle (persistence, history,
summarisation) is handled by ``AIClient.achat_stream``; this module
only deals with web-specific concerns (SSE formatting, per-sentence
TTS streaming, audio base64 encoding).
"""

import asyncio
import base64
import contextlib
import io
import json
import sys
from collections.abc import AsyncGenerator
from pathlib import Path

import numpy as np
import soundfile as sf
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel


# Add src to path
src_path = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(src_path))

from apps.web.backend.config import WebBackendConfig
from imports import AIClient, KokoroVoiceModel, printer
from lib.mcp.index import register_all_tools
from lib.services.ai_client.registry import MCPServerRegistry
from lib.services.tts.utils import is_speakable


router = APIRouter()

# Configuration
config = WebBackendConfig()

# Global clients
ai_client: AIClient | None = None
tts_processor: KokoroVoiceModel | None = None
mcp_registry: MCPServerRegistry | None = None

# Sentinel pushed into the audio queue to signal "no more sentences"
_TTS_DONE = object()

# Maximum number of sentences that can be queued for TTS at once.
# Provides natural back-pressure if the LLM streams much faster than TTS.
_TTS_QUEUE_MAX = 10


class StreamChatRequest(BaseModel):
    """Streaming chat request"""

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
                system_instruction=str(config.system_instruction) if config.system_instruction else None,
            )
            return registry, client

        mcp_registry, ai_client = await asyncio.to_thread(_build_ai)
        printer.success(f"AIClient ready: {config.ai_provider}/{config.ai_model}")

    if tts_processor is None:
        tts_processor = await asyncio.to_thread(KokoroVoiceModel)
        printer.success(f"TTS ready: {config.voice_name}")


def _encode_audio(audio_data: np.ndarray, sample_rate: int) -> str:
    """Encode a numpy audio array to a base64 WAV string."""
    buf = io.BytesIO()
    sf.write(buf, audio_data, sample_rate, format="WAV")
    return base64.b64encode(buf.getvalue()).decode()


async def _tts_worker(
    sentence_queue: asyncio.Queue,
    audio_queue: asyncio.Queue,
) -> None:
    """
    Background task: pull sentences from *sentence_queue*, run TTS in a
    thread, and push encoded audio into *audio_queue*.

    Each sentence is wrapped in its own try/except so a single TTS
    failure never poisons the rest of the audio stream.
    """
    while True:
        sentence = await sentence_queue.get()
        if sentence is _TTS_DONE:
            # Signal the consumer that all audio has been produced
            await audio_queue.put(_TTS_DONE)
            break

        try:
            printer.info(f"[TTS worker] Generating audio for: '{sentence[:50]}...'")
            audio_data, sr = await asyncio.to_thread(tts_processor.generate, sentence)
            audio_b64 = _encode_audio(audio_data, sr)
            await audio_queue.put({"audio": audio_b64, "sample_rate": sr})
            printer.success("[TTS worker] Audio chunk ready")
        except Exception as e:
            # Log and skip — do NOT propagate. Text stream is unaffected.
            printer.error(f"[TTS worker] TTS failed for sentence, skipping: {e}")


async def stream_chat_response(prompt: str, conversation_id: str | None = None) -> AsyncGenerator[str, None]:
    """
    Stream chat response with text and audio chunks via SSE.

    **Architecture** — text and audio are decoupled:

    - Text events are yielded *immediately* as they arrive from the LLM.
    - Complete sentences are pushed to a bounded ``sentence_queue``.
    - A background ``_tts_worker`` task consumes sentences, generates
      audio in a thread, and pushes results into ``audio_queue``.
    - Between text yields (and after the LLM is done) the generator
      drains ``audio_queue`` non-blockingly and yields audio events.

    This means a TTS failure or slowdown **never** blocks text delivery.

    Event types:
    - conversation_id: Emitted once at the start with the conversation ID
    - text: AI response text chunk
    - audio: Base64 encoded audio chunk
    - usage: Token usage data
    - done: Streaming complete
    - error: Error occurred
    """

    sentence_queue: asyncio.Queue = asyncio.Queue(maxsize=_TTS_QUEUE_MAX)
    audio_queue: asyncio.Queue = asyncio.Queue()
    tts_task: asyncio.Task | None = None

    async def _drain_audio() -> AsyncGenerator[str, None]:
        """Yield all audio SSE events that are ready *right now* (non-blocking)."""
        while True:
            try:
                item = audio_queue.get_nowait()
            except asyncio.QueueEmpty:
                break
            if item is _TTS_DONE:
                # Put it back so the post-stream drain sees it too
                await audio_queue.put(_TTS_DONE)
                break
            yield f"event: audio\ndata: {json.dumps(item)}\n\n"

    try:
        await _init_clients()

        # Start the TTS background worker
        tts_task = asyncio.create_task(_tts_worker(sentence_queue, audio_queue))

        text_buffer = ""
        full_response = ""
        sentence_endings = [".", "!", "?", "\n"]
        audio_count = 0

        async for chunk in ai_client.achat_stream(
            prompt=prompt,
            conversation_id=conversation_id,
            provider_meta={"provider": config.ai_provider, "model": config.ai_model},
        ):
            # ── Dict sentinel: conversation_id (emitted first) ──
            if isinstance(chunk, dict) and "__conversation_id__" in chunk:
                conv_id = chunk["__conversation_id__"]
                yield f"event: conversation_id\ndata: {json.dumps({'conversation_id': conv_id})}\n\n"
                continue

            # ── Dict sentinel: done (emitted last) ──
            if isinstance(chunk, dict) and chunk.get("__done__"):
                full_response = chunk.get("full_response", full_response)
                usage = chunk.get("usage")

                # Queue any remaining text buffer for TTS
                if text_buffer.strip() and is_speakable(text_buffer):
                    printer.info(f"Queueing remaining text for TTS: '{text_buffer[:50]}...'")
                    await sentence_queue.put(text_buffer.strip())

                # Signal TTS worker that no more sentences are coming
                await sentence_queue.put(_TTS_DONE)

                # Wait for the TTS worker to finish (with timeout)
                try:
                    await asyncio.wait_for(tts_task, timeout=30.0)
                except TimeoutError:
                    printer.warning("TTS worker timed out after 30s, sending done anyway")
                    tts_task.cancel()

                # Drain all remaining audio events
                while True:
                    try:
                        item = await asyncio.wait_for(audio_queue.get(), timeout=0.1)
                    except (TimeoutError, asyncio.QueueEmpty):
                        break
                    if item is _TTS_DONE:
                        break
                    audio_count += 1
                    printer.success(f"Sent audio chunk {audio_count}")
                    yield f"event: audio\ndata: {json.dumps(item)}\n\n"

                if usage:
                    printer.info(
                        f"Token usage: {usage.get('input_tokens', 0)} in / "
                        f"{usage.get('output_tokens', 0)} out / "
                        f"{usage.get('total_tokens', 0)} total"
                    )
                    yield f"event: usage\ndata: {json.dumps({'usage': usage})}\n\n"

                printer.info(f"Stream complete: sent {audio_count} audio chunks")
                yield f"event: done\ndata: {json.dumps({'audio_count': audio_count})}\n\n"
                continue

            # ── Regular text chunk ──
            assert isinstance(chunk, str)
            yield f"event: text\ndata: {json.dumps({'text': chunk})}\n\n"

            full_response += chunk
            text_buffer += chunk

            # Check for complete sentences → queue for background TTS
            for ending in sentence_endings:
                if ending in text_buffer:
                    parts = text_buffer.split(ending, 1)
                    sentence = (parts[0] + ending).strip()

                    if sentence and is_speakable(sentence):
                        printer.info(f"Queueing for TTS: '{sentence[:50]}...'")
                        await sentence_queue.put(sentence)

                    text_buffer = parts[1] if len(parts) > 1 else ""
                    break

            # Non-blocking drain: yield any audio chunks that are ready
            async for audio_event in _drain_audio():
                audio_count += 1
                printer.success(f"Sent audio chunk {audio_count}")
                yield audio_event

    except Exception as e:
        printer.error(f"Stream error: {e}")
        yield f"event: error\ndata: {json.dumps({'error': str(e)})}\n\n"

    finally:
        # Ensure the TTS worker is cleaned up if the client disconnects
        if tts_task and not tts_task.done():
            tts_task.cancel()
            with contextlib.suppress(asyncio.CancelledError, Exception):
                await tts_task


@router.post("/")
async def stream_chat(request: StreamChatRequest):
    """
    Streaming chat endpoint using Server-Sent Events

    Returns:
        StreamingResponse with events:
        - conversation_id: Conversation ID for this session
        - text: Text chunks from AI
        - audio: Base64 encoded audio chunks
        - usage: Token usage data
        - done: Streaming complete
        - error: Error message
    """
    return StreamingResponse(
        stream_chat_response(request.message, conversation_id=request.conversation_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        },
    )
