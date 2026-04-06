"""Streaming Chat API endpoint with Server-Sent Events (SSE).

Text is streamed immediately.  TTS runs in a background task and is
fully decoupled — a TTS failure never blocks or kills the text stream.
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


src_path = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(src_path))

from apps.web.backend import state
from apps.web.backend.config import WebBackendConfig
from imports import printer
from lib.services.tts.utils import is_speakable


router = APIRouter()

config = WebBackendConfig()

# Sentinel pushed into the audio queue to signal "no more sentences"
_TTS_DONE = object()

# Maximum number of sentences that can be queued for TTS at once.
# Provides natural back-pressure if the LLM streams much faster than TTS.
_TTS_QUEUE_MAX = 10


class StreamChatRequest(BaseModel):
    """Request body for the streaming chat endpoint."""

    message: str
    conversation_id: str | None = None


def _encode_audio(audio_data: np.ndarray, sample_rate: int) -> str:
    buf = io.BytesIO()
    sf.write(buf, audio_data, sample_rate, format="WAV")
    return base64.b64encode(buf.getvalue()).decode()


async def _tts_worker(
    sentence_queue: asyncio.Queue,
    audio_queue: asyncio.Queue,
) -> None:
    """Pull sentences from *sentence_queue*, run TTS, push audio into *audio_queue*."""
    while True:
        sentence = await sentence_queue.get()
        if sentence is _TTS_DONE:
            await audio_queue.put(_TTS_DONE)
            break

        try:
            printer.info(f"[TTS worker] Generating audio for: '{sentence[:50]}...'")
            audio_data, sr = await asyncio.to_thread(state.tts_processor.generate, sentence)
            audio_b64 = _encode_audio(audio_data, sr)
            await audio_queue.put({"audio": audio_b64, "sample_rate": sr})
            printer.success("[TTS worker] Audio chunk ready")
        except Exception as e:
            # Log and skip — do NOT propagate.  Text stream is unaffected.
            printer.error(f"[TTS worker] TTS failed for sentence, skipping: {e}")


async def stream_chat_response(prompt: str, conversation_id: str | None = None) -> AsyncGenerator[str, None]:
    """Stream chat response with text and audio chunks via SSE."""

    sentence_queue: asyncio.Queue = asyncio.Queue(maxsize=_TTS_QUEUE_MAX)
    audio_queue: asyncio.Queue = asyncio.Queue()
    tts_task: asyncio.Task | None = None

    async def _drain_audio() -> AsyncGenerator[str, None]:
        while True:
            try:
                item = audio_queue.get_nowait()
            except asyncio.QueueEmpty:
                break
            if item is _TTS_DONE:
                await audio_queue.put(_TTS_DONE)
                break
            yield f"event: audio\ndata: {json.dumps(item)}\n\n"

    try:
        await state.init(config)

        ai_client = await state.get_or_create_ai_client(conversation_id)

        tts_task = asyncio.create_task(_tts_worker(sentence_queue, audio_queue))

        text_buffer = ""
        full_response = ""
        sentence_endings = [".", "!", "?", "\n"]
        audio_count = 0
        active_conversation_id = conversation_id

        async for chunk in ai_client.achat_stream(
            prompt=prompt,
            conversation_id=conversation_id,
            provider_meta={"provider": config.ai_provider, "model": config.ai_model},
        ):
            if isinstance(chunk, dict) and "__conversation_id__" in chunk:
                conv_id = chunk["__conversation_id__"]
                active_conversation_id = conv_id
                yield f"event: conversation_id\ndata: {json.dumps({'conversation_id': conv_id})}\n\n"
                continue

            if isinstance(chunk, dict) and chunk.get("__done__"):
                full_response = chunk.get("full_response", full_response)
                usage = chunk.get("usage")

                # If achat_stream created a new conversation_id, register this client
                if active_conversation_id and active_conversation_id != conversation_id:
                    state.set_client(active_conversation_id, ai_client)

                if text_buffer.strip() and is_speakable(text_buffer):
                    printer.info(f"Queueing remaining text for TTS: '{text_buffer[:50]}...'")
                    await sentence_queue.put(text_buffer.strip())

                await sentence_queue.put(_TTS_DONE)

                try:
                    await asyncio.wait_for(tts_task, timeout=30.0)
                except TimeoutError:
                    printer.warning("TTS worker timed out after 30s, sending done anyway")
                    tts_task.cancel()

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

            assert isinstance(chunk, str)
            yield f"event: text\ndata: {json.dumps({'text': chunk})}\n\n"

            full_response += chunk
            text_buffer += chunk

            for ending in sentence_endings:
                if ending in text_buffer:
                    parts = text_buffer.split(ending, 1)
                    sentence = (parts[0] + ending).strip()

                    if sentence and is_speakable(sentence):
                        printer.info(f"Queueing for TTS: '{sentence[:50]}...'")
                        await sentence_queue.put(sentence)

                    text_buffer = parts[1] if len(parts) > 1 else ""
                    break

            async for audio_event in _drain_audio():
                audio_count += 1
                printer.success(f"Sent audio chunk {audio_count}")
                yield audio_event

    except Exception as e:
        printer.error(f"Stream error: {e}")
        yield f"event: error\ndata: {json.dumps({'error': str(e)})}\n\n"

    finally:
        if tts_task and not tts_task.done():
            tts_task.cancel()
            with contextlib.suppress(asyncio.CancelledError, Exception):
                await tts_task


@router.post("/")
async def stream_chat(request: StreamChatRequest):
    return StreamingResponse(
        stream_chat_response(request.message, conversation_id=request.conversation_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
