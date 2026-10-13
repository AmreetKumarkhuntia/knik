"""Streaming Chat API endpoint with Server-Sent Events (SSE).

Text is streamed immediately.  TTS runs in a background task and is
fully decoupled — a TTS failure never blocks or kills the text stream.
"""

import asyncio
import base64
import contextlib
import io
import json
from collections.abc import AsyncGenerator

import numpy as np
import soundfile as sf
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from backend.deps import get_state
from backend.models.chat import ChatRequest
from backend.state import AppState
from imports import (
    DB_ERRORS,
    ConversationDB,
    ConversationReady,
    StreamDone,
    StreamError,
    TextDelta,
    ToolCallFinished,
    ToolCallStarted,
    VoiceModel,
    is_speakable,
    printer,
)


router = APIRouter()

_TTS_DONE = object()

# Provides natural back-pressure if the LLM streams much faster than TTS.
_TTS_QUEUE_MAX = 10


def _sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


def _encode_audio(audio_data: np.ndarray, sample_rate: int) -> str:
    buf = io.BytesIO()
    sf.write(buf, audio_data, sample_rate, format="WAV")
    return base64.b64encode(buf.getvalue()).decode()


async def _tts_worker(
    tts: VoiceModel,
    sentence_queue: asyncio.Queue,
    audio_queue: asyncio.Queue,
) -> None:
    while True:
        sentence = await sentence_queue.get()
        if sentence is _TTS_DONE:
            await audio_queue.put(_TTS_DONE)
            break

        try:
            printer.info(f"[TTS worker] Generating audio for: '{sentence[:50]}...'")
            audio_data, sr = await asyncio.to_thread(tts.generate, sentence)
            audio_b64 = _encode_audio(audio_data, sr)
            await audio_queue.put({"audio": audio_b64, "sample_rate": sr})
            printer.success("[TTS worker] Audio chunk ready")
        except Exception as e:
            # Log and skip — do NOT propagate.  Text stream is unaffected.
            printer.error(f"[TTS worker] TTS failed for sentence, skipping: {e}")


async def _summary_message_id(conversation_id: str | None) -> str | None:
    """The conversation's compaction pointer; None without a conversation or a database, so chat keeps working."""
    if not conversation_id:
        return None
    try:
        summary_message_id, _ = await ConversationDB.get_compaction_state(conversation_id)
    except DB_ERRORS as e:
        printer.warning(f"Compaction state unavailable for {conversation_id}: {e}")
        return None
    return summary_message_id


async def stream_chat_response(
    state: AppState,
    prompt: str,
    conversation_id: str | None = None,
) -> AsyncGenerator[str, None]:
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
            yield _sse("audio", item)

    try:
        async with state.client(conversation_id) as ai_client:
            tts_task = asyncio.create_task(_tts_worker(state.tts, sentence_queue, audio_queue))

            text_buffer = ""
            sentence_endings = [".", "!", "?", "\n"]
            audio_count = 0
            active_conversation_id = conversation_id
            pre_compaction_state = await _summary_message_id(conversation_id)

            async for event in ai_client.achat_stream(
                prompt=prompt,
                conversation_id=conversation_id,
                provider_meta={"provider": state.config.ai_provider, "model": state.config.ai_model},
            ):
                match event:
                    case ConversationReady(conversation_id=conv_id):
                        active_conversation_id = conv_id
                        yield _sse("conversation_id", {"conversation_id": conv_id})

                    case StreamDone(usage=usage):
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
                            yield _sse("audio", item)

                        if usage:
                            printer.info(
                                f"Token usage: {usage.get('input_tokens', 0)} in / "
                                f"{usage.get('output_tokens', 0)} out / "
                                f"{usage.get('total_tokens', 0)} total"
                            )
                            yield _sse("usage", {"usage": usage})

                        if active_conversation_id:
                            post_compaction_state = await _summary_message_id(active_conversation_id)
                            if post_compaction_state and post_compaction_state != pre_compaction_state:
                                yield _sse("compaction", {"summary_message_id": post_compaction_state})

                        printer.info(f"Stream complete: sent {audio_count} audio chunks")
                        yield _sse("done", {"audio_count": audio_count})

                    case ToolCallStarted(tool_name=tool_name, tool_args=tool_args):
                        yield _sse("tool_start", {"tool_name": tool_name, "tool_args": tool_args})

                    case ToolCallFinished(tool_name=tool_name, result_preview=result_preview):
                        yield _sse("tool_end", {"tool_name": tool_name, "tool_result_preview": result_preview})

                    # A provider failure reads as reply text ("Chat streaming error: ..."), as it always has.
                    case TextDelta(text=text) | StreamError(message=text):
                        yield _sse("text", {"text": text})

                        text_buffer += text

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
        yield _sse("error", {"error": str(e)})

    finally:
        if tts_task and not tts_task.done():
            tts_task.cancel()
            with contextlib.suppress(asyncio.CancelledError, Exception):
                await tts_task


@router.post("/")
async def stream_chat(request: ChatRequest, state: AppState = Depends(get_state)):
    return StreamingResponse(
        stream_chat_response(state, request.message, conversation_id=request.conversation_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
