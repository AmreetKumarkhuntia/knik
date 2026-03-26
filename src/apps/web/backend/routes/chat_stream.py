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
from lib.services.conversation import ConversationDB


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


async def _get_history_for_conversation(conversation_id: str | None) -> list:
    """Retrieve conversation history for LLM context.

    If a conversation_id is provided and the DB is available, loads from DB.
    Otherwise falls back to the in-memory ConversationHistory cache.
    """
    history_context_size = getattr(config, "history_context_size", 5)

    if conversation_id and await ConversationDB.is_available():
        try:
            messages = await ConversationDB.get_recent_messages(
                conversation_id,
                last_n=history_context_size * 2,  # *2 because each turn = 2 messages
            )
            # Convert to LangChain-compatible format
            from langchain_core.messages import AIMessage, HumanMessage

            langchain_msgs = []
            for msg in messages:
                if msg.role == "user":
                    langchain_msgs.append(HumanMessage(content=msg.content))
                elif msg.role == "assistant":
                    langchain_msgs.append(AIMessage(content=msg.content))
            return langchain_msgs
        except Exception as e:
            printer.warning(f"Failed to load DB history, falling back to in-memory: {e}")

    # Fallback: in-memory history
    return conversation_history.get_messages(last_n=history_context_size)


async def stream_chat_response(prompt: str, conversation_id: str | None = None) -> AsyncGenerator[str, None]:
    """
    Stream chat response with text and audio chunks via SSE.

    Event types:
    - conversation_id: Emitted once at the start with the conversation ID
    - text: AI response text chunk
    - audio: Base64 encoded audio chunk
    - done: Streaming complete
    - error: Error occurred
    """
    try:
        await _init_clients()
        db_available = await ConversationDB.is_available()

        # Create or reuse a conversation in the DB
        if db_available:
            try:
                if not conversation_id:
                    conversation_id = await ConversationDB.create_conversation()
                    printer.info(f"Created new conversation: {conversation_id}")
                else:
                    # Verify conversation exists
                    existing = await ConversationDB.get_conversation(conversation_id)
                    if not existing:
                        conversation_id = await ConversationDB.create_conversation()
                        printer.info(f"Conversation not found, created new: {conversation_id}")
            except Exception as e:
                printer.warning(f"DB conversation creation failed: {e}")
                conversation_id = None

        # Emit the conversation_id so the frontend can track it
        if conversation_id:
            yield f"event: conversation_id\ndata: {json.dumps({'conversation_id': conversation_id})}\n\n"

        # Save user message to DB
        if conversation_id and db_available:
            try:
                await ConversationDB.append_message(
                    conversation_id=conversation_id,
                    role="user",
                    content=prompt,
                    metadata={"provider": config.ai_provider, "model": config.ai_model},
                )
            except Exception as e:
                printer.warning(f"Failed to save user message to DB: {e}")

        # Fetch recent history for LLM context
        history = await _get_history_for_conversation(conversation_id)

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

        # Persist the assistant response
        if full_response.strip():
            # Always update in-memory history (backwards-compatible)
            conversation_history.add_entry(user_input=prompt, ai_response=full_response.strip())
            printer.info(f"Saved turn to in-memory history (total turns: {len(conversation_history.entries)})")

            # Persist to DB
            if conversation_id and db_available:
                try:
                    await ConversationDB.append_message(
                        conversation_id=conversation_id,
                        role="assistant",
                        content=full_response.strip(),
                        metadata={
                            "provider": config.ai_provider,
                            "model": config.ai_model,
                            "audio_chunks": audio_count,
                        },
                    )
                    printer.info(f"Saved assistant message to DB for conversation: {conversation_id}")

                    # Generate title after first exchange (async fire-and-forget)
                    msg_count = await ConversationDB.get_message_count(conversation_id)
                    if msg_count == 2:  # First user + first assistant = 2 messages
                        asyncio.create_task(
                            ConversationDB.generate_and_set_title(
                                conversation_id=conversation_id,
                                first_message=prompt,
                                ai_client=ai_client,
                            )
                        )
                except Exception as e:
                    printer.warning(f"Failed to save assistant message to DB: {e}")

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
        - conversation_id: Conversation ID for this session
        - text: Text chunks from AI
        - audio: Base64 encoded audio chunks
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
