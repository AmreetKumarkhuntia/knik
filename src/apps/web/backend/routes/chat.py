"""
Unified Chat API endpoint
Handles AI chat + TTS in a single request.

All blocking operations (AI inference, TTS) are offloaded to background
threads via asyncio.to_thread so the event loop stays responsive.
"""

import asyncio
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
from lib.mcp.index import register_all_tools
from lib.services.ai_client.registry import MCPServerRegistry
from lib.services.conversation import ConversationDB


router = APIRouter()

# Configuration
config = WebBackendConfig()

# Global clients
ai_client: AIClient | None = None
tts_processor: TTSAsyncProcessor | None = None
mcp_registry: MCPServerRegistry | None = None


class SimpleChatRequest(BaseModel):
    """Simple chat request - just text"""

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
                system_instruction=config.system_instruction,
            )
            return registry, client

        mcp_registry, ai_client = await asyncio.to_thread(_build_ai)
        printer.success(f"AIClient ready: {config.ai_provider}/{config.ai_model}")

    if tts_processor is None:
        tts_processor = await asyncio.to_thread(
            TTSAsyncProcessor, voice_model=config.voice_name, sample_rate=config.sample_rate
        )
        printer.success(f"TTS ready: {config.voice_name}")


@router.post("/")
async def chat(request: SimpleChatRequest):
    """
    Unified chat endpoint: Send text, get back text + audio

    Request: {"message": "Hello", "conversation_id": "optional-uuid"}
    Response: {"text": "Hi there!", "audio": "base64...", "sample_rate": 24000, "conversation_id": "uuid"}
    """
    try:
        await _init_clients()
        db_available = await ConversationDB.is_available()

        conversation_id = request.conversation_id

        # Create or verify conversation in DB
        if db_available:
            try:
                if not conversation_id:
                    conversation_id = await ConversationDB.create_conversation()
                else:
                    existing = await ConversationDB.get_conversation(conversation_id)
                    if not existing:
                        conversation_id = await ConversationDB.create_conversation()
            except Exception as e:
                printer.warning(f"DB conversation creation failed: {e}")
                conversation_id = None

        # Save user message to DB
        if conversation_id and db_available:
            try:
                await ConversationDB.append_message(
                    conversation_id=conversation_id,
                    role="user",
                    content=request.message,
                    metadata={"provider": config.ai_provider, "model": config.ai_model},
                )
            except Exception as e:
                printer.warning(f"Failed to save user message: {e}")

        # Get AI response (offloaded to thread — blocks on LLM HTTP calls)
        response_text = await asyncio.to_thread(lambda: "".join(ai_client.chat_stream(prompt=request.message)))

        # Save assistant message to DB
        if conversation_id and db_available and response_text.strip():
            try:
                await ConversationDB.append_message(
                    conversation_id=conversation_id,
                    role="assistant",
                    content=response_text.strip(),
                    metadata={"provider": config.ai_provider, "model": config.ai_model},
                )

                # Generate title after first exchange
                msg_count = await ConversationDB.get_message_count(conversation_id)
                if msg_count == 2:
                    asyncio.create_task(
                        ConversationDB.generate_and_set_title(
                            conversation_id=conversation_id,
                            first_message=request.message,
                            ai_client=ai_client,
                        )
                    )
            except Exception as e:
                printer.warning(f"Failed to save assistant message: {e}")

        # Generate audio (offloaded to thread — CPU-heavy PyTorch inference)
        audio_data, sample_rate = await asyncio.to_thread(tts_processor.tts_processor.generate, response_text)

        # Convert to base64 (fast, stays on event loop)
        buffer = io.BytesIO()
        sf.write(buffer, audio_data, sample_rate, format="WAV")
        audio_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

        return {
            "text": response_text,
            "audio": audio_base64,
            "sample_rate": config.sample_rate,
            "conversation_id": conversation_id,
        }

    except Exception as e:
        printer.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e
