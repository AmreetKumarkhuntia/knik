"""
Streaming Chat API endpoint with Server-Sent Events (SSE)
Streams both text and audio progressively as they're generated.

The route is a thin orchestrator: AI lifecycle (persistence, history,
summarisation) is handled by ``AIClient.achat_stream``; this module
only deals with web-specific concerns (SSE formatting, per-sentence
TTS streaming, audio base64 encoding).
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
from lib.core.config import Config
from lib.mcp.index import register_all_tools
from lib.services.ai_client.registry import MCPServerRegistry


router = APIRouter()

# Configuration
config = WebBackendConfig()

# Global clients
ai_client: AIClient | None = None
tts_processor: KokoroVoiceModel | None = None
mcp_registry: MCPServerRegistry | None = None

# In-memory conversation history — used as a fast cache for LLM context
# when no conversation_id is provided (backwards-compatible)
conversation_history = ConversationHistory(max_size=50)


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


async def stream_chat_response(prompt: str, conversation_id: str | None = None) -> AsyncGenerator[str, None]:
    """
    Stream chat response with text and audio chunks via SSE.

    Event types:
    - conversation_id: Emitted once at the start with the conversation ID
    - text: AI response text chunk
    - audio: Base64 encoded audio chunk
    - usage: Token usage data
    - done: Streaming complete
    - error: Error occurred
    """
    try:
        await _init_clients()

        # In-memory fallback: when no conversation_id is provided, pass
        # the in-memory history to achat_stream so it can still use context.
        # achat_stream will load DB history itself when conversation_id is set.
        fallback_history = None
        if not conversation_id:
            fallback_history = conversation_history.get_messages(
                last_n=Config().history_context_size,
            )

        text_buffer = ""
        full_response = ""
        sentence_endings = [".", "!", "?", "\n"]
        audio_count = 0

        async for chunk in ai_client.achat_stream(
            prompt=prompt,
            conversation_id=conversation_id,
            history=fallback_history,
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

                # Update in-memory history (backwards-compatible for anonymous sessions)
                if full_response.strip():
                    conversation_history.add_entry(user_input=prompt, ai_response=full_response.strip())
                    printer.info(f"Saved turn to in-memory history (total turns: {len(conversation_history.entries)})")

                # Flush remaining text buffer to TTS
                if text_buffer.strip():
                    printer.info(f"Generating audio for remaining: '{text_buffer[:50]}...'")
                    audio_data, sr = await asyncio.to_thread(tts_processor.generate, text_buffer.strip())

                    buf = io.BytesIO()
                    sf.write(buf, audio_data, sr, format="WAV")
                    audio_b64 = base64.b64encode(buf.getvalue()).decode()

                    yield f"event: audio\ndata: {json.dumps({'audio': audio_b64, 'sample_rate': sr})}\n\n"
                    audio_count += 1
                    printer.success(f"Sent final audio chunk {audio_count}")

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

            # ── Regular text chunk (type-narrow after dict branches above) ──
            assert isinstance(chunk, str)
            yield f"event: text\ndata: {json.dumps({'text': chunk})}\n\n"

            full_response += chunk
            text_buffer += chunk

            # Check for complete sentences → generate TTS per sentence
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

    except Exception as e:
        printer.error(f"Stream error: {e}")
        yield f"event: error\ndata: {json.dumps({'error': str(e)})}\n\n"


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
