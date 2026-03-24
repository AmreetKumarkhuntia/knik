# Streaming Architecture

This document describes the real-time streaming system for text and audio responses in the Knik web app.

## Overview

The streaming system delivers AI responses progressively:

1. **Text streams immediately** -- users see text as it's generated (token by token)
2. **Audio streams at sentence boundaries** -- audio chunks are generated and sent as complete sentences accumulate
3. **SSE transport** -- Server-Sent Events over HTTP for one-way streaming

## Architecture

### Flow Diagram

```
User Message
    |
    v
POST /api/chat/stream
    |
    v
AIClient.chat_stream(prompt, history) --> text chunks (generator)
    |                                          |
    |                                    SSE: event=text
    |                                          |
    v                                     Frontend
Sentence buffer accumulates text              |
    |                                         v
    v                               appendToChat(chunk)
Sentence complete (. ! ? \n)
    |
    v
KokoroVoiceModel.generate(sentence) --> audio bytes
    |
    v
Base64 encode WAV
    |
    v
SSE: event=audio
    |
    v
Frontend audio queue --> sequential playback
```

### Key Design Decision: Synchronous TTS

The streaming endpoint generates audio **synchronously** using `KokoroVoiceModel.generate()` directly within the SSE generator. This means:

- Audio generation blocks text streaming temporarily (per-sentence)
- Simpler implementation than the async `TTSAsyncProcessor` pattern
- Each sentence is fully generated before the next text chunk is sent

> **Note:** The `TTSAsyncProcessor` class (at `src/lib/services/tts/processor.py`) supports an `audio_ready_callback` parameter for non-blocking audio generation, but the web streaming endpoint does not currently use it.

## Components

### 1. Streaming Endpoint

**File:** `src/apps/web/backend/routes/chat_stream.py`

**Endpoint:** `POST /api/chat/stream/`

**Technology:** Server-Sent Events (SSE) via `StreamingResponse`

**Request:**

```json
{
  "message": "Tell me a joke"
}
```

**SSE Event Types:**

| Event | Data Format | Description |
| --- | --- | --- |
| `text` | `{"text": "chunk"}` | AI text chunk |
| `audio` | `{"audio": "base64...", "sample_rate": 24000}` | Base64-encoded WAV audio chunk |
| `done` | `{"audio_count": N}` | Stream complete |
| `error` | `{"error": "message"}` | Error message |

**Response Headers:**

```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
X-Accel-Buffering: no
```

**Example SSE Stream:**

```
event: text
data: {"text": "Why"}

event: text
data: {"text": " did the"}

event: text
data: {"text": " chicken"}

event: audio
data: {"audio": "UklGRiQAAABXQVZFZm10IBAA...", "sample_rate": 24000}

event: text
data: {"text": " cross the road?"}

event: audio
data: {"audio": "UklGRiQAAABXQVZFZm10IBAA...", "sample_rate": 24000}

event: done
data: {"audio_count": 2}
```

### 2. Frontend Streaming Client

**File:** `src/apps/web/frontend/src/services/streaming.ts`

**Main Function:** `streamChat(message, callbacks)`

Returns an `AbortController` for cancellation.

```typescript
import { streamChat } from "$services/streaming";

const controller = await streamChat("Hello!", {
  onText: (chunk) => {
    appendToChat(chunk);
  },
  onAudio: (audioBase64) => {
    queueAudio(audioBase64, 24000);
  },
  onComplete: (count) => {
    console.log(`Done! ${count} audio chunks`);
  },
  onError: (error) => {
    console.error(error);
  },
});

// Cancel streaming
controller.abort();
```

Uses `VITE_API_URL` env var or falls back to `http://localhost:8000`.

### 3. Audio Service Layer

**Directory:** `src/apps/web/frontend/src/services/audio/`

| File | Responsibility |
| --- | --- |
| `queue.ts` | Receives chunks via `queueAudio()`, plays them sequentially |
| `playback.ts` | Decodes base64 WAV, drives `HTMLAudioElement`, emits state |
| `mediaSession.ts` | Keeps browser Media Session API in sync |
| `index.ts` | Barrel exports |

**Playback Control API:**

```typescript
import {
  pauseAudio,
  resumeAudio,
  stopAudio,
  clearAudioQueue,
  setAudioStateCallback,
} from "$services/audio";

// Listen to state changes
setAudioStateCallback((isPaused, isPlaying) => {
  setAudioPaused(isPaused);
  setAudioPlaying(isPlaying);
});

pauseAudio();       // Pause current chunk
resumeAudio();      // Resume
stopAudio();        // Stop current + clear queue
clearAudioQueue();  // Clear pending chunks only
```

### 4. React Integration

**Hooks:**

- `useChat` (`src/apps/web/frontend/src/lib/hooks/useChat.ts`) -- consumes `streamChat`, `queueAudio`, `clearAudioQueue`
- `useAudio` (`src/apps/web/frontend/src/lib/hooks/useAudio.ts`) -- consumes `setAudioStateCallback`, `stopAudio`, `pauseAudio`, `resumeAudio`

**UI Component:**

- `AudioControls` (`src/apps/web/frontend/src/lib/sections/audio/AudioControls.tsx`) -- pause/resume/stop buttons

## Implementation Details

### Sentence-Based Chunking

Audio is generated at sentence boundaries for natural pacing:

```python
text_buffer = ""
sentence_endings = [".", "!", "?", "\n"]

for text_chunk in ai_client.chat_stream(prompt, history):
    yield sse_event("text", {"text": text_chunk})

    text_buffer += text_chunk

    for ending in sentence_endings:
        if ending in text_buffer:
            parts = text_buffer.split(ending, 1)
            sentence = parts[0] + ending
            text_buffer = parts[1] if len(parts) > 1 else ""

            audio = voice_model.generate(sentence.strip())
            wav_base64 = encode_wav_base64(audio, sample_rate)
            yield sse_event("audio", {"audio": wav_base64, "sample_rate": sample_rate})
            break
```

### Client-Side Audio Playback

Chunks are queued and played sequentially:

```typescript
// queue.ts
export function queueAudio(base64Audio: string, sampleRate: number): void {
  audioQueue.push({ audio: base64Audio, sampleRate });
  if (!isPlayingQueue) playQueue(); // start draining if idle
}

// playback.ts
export function playAudio(base64Audio: string): Promise<void> {
  return new Promise((resolve) => {
    const bytes = Uint8Array.from(atob(base64Audio), (c) => c.charCodeAt(0));
    const url = URL.createObjectURL(new Blob([bytes], { type: "audio/wav" }));
    const audio = new Audio(url);
    audio.onended = () => {
      URL.revokeObjectURL(url);
      notifyStateChange(false, false);
      resolve();
    };
    audio.play().then(() => notifyStateChange(false, true));
  });
}
```

**Design decisions:**

- Audio chunks play **sequentially** (no overlap)
- The `loading` state keeps Pause/Stop visible between chunks
- `stopAudio()` + `clearAudioQueue()` abort both current playback and pending chunks

### Conversation History

The streaming endpoint maintains a global `ConversationHistory(max_size=50)` instance. After each complete response, the turn is saved. The number of recent turns sent as context is configurable via `KNIK_HISTORY_CONTEXT_SIZE` (default: 5).

## Configuration

**Backend defaults** (from `src/apps/web/backend/config.py`):

| Setting | Env Variable | Default |
| --- | --- | --- |
| Voice | `KNIK_VOICE_NAME` | `af_sarah` |
| Sample Rate | `KNIK_SAMPLE_RATE` | `24000` |
| AI Provider | `KNIK_AI_PROVIDER` | `vertex` |
| AI Model | `KNIK_AI_MODEL` | `gemini-2.0-flash-exp` |
| History Context | `KNIK_HISTORY_CONTEXT_SIZE` | `5` |

## Testing

### Backend

```bash
# Start backend
npm run start:web:backend

# Test with curl (SSE stream)
curl -N -X POST http://localhost:8000/api/chat/stream/ \
  -H "Content-Type: application/json" \
  -d '{"message": "Tell me a short joke"}'
```

### Frontend

```bash
# Start frontend
npm run start:web:frontend

# Open http://localhost:12414 and use the chat interface
```

## Stream vs Non-Stream Comparison

| Aspect | `/api/chat` (non-stream) | `/api/chat/stream` (SSE) |
| --- | --- | --- |
| Response type | Single JSON | SSE event stream |
| Text delivery | After full generation | Token by token |
| Audio delivery | Full audio in response | Per-sentence chunks |
| Perceived latency | Higher (wait for all) | Lower (instant text) |
| Memory | Higher (full audio in RAM) | Lower (streaming chunks) |
| Complexity | Simpler | More complex |
| Frontend usage | Not used currently | Primary chat interface |

## TTSAsyncProcessor Reference

While the streaming endpoint uses synchronous TTS, the `TTSAsyncProcessor` class supports async audio generation with callbacks:

```python
from lib.services.tts.processor import TTSAsyncProcessor

tts = TTSAsyncProcessor(
    sample_rate=24000,
    voice_model="af_sarah",
    play_voice=False,
    audio_ready_callback=lambda audio, sr: handle_audio(audio, sr),
)
tts.start_async_processing()
tts.play_async("Hello world")  # Non-blocking, callback fires when ready
```

Constructor parameters:

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `sample_rate` | `int` | - | Audio sample rate |
| `voice_model` | `str` | `Config.DEFAULT_TTS` | TTS voice name |
| `save_dir` | `str \| None` | `None` | Directory to save audio files |
| `play_voice` | `bool` | `True` | Play audio locally |
| `sleep_duration` | `float` | `0.3` | Sleep between processing cycles |
| `audio_ready_callback` | `Callable[[bytes, int], None] \| None` | `None` | Callback when audio is ready |

## Best Practices

1. Set `play_voice=False` for web backend (frontend handles playback)
2. Handle stream cancellation (AbortController) on component unmount
3. Provide loading state during streaming
4. Handle errors gracefully (network issues, timeouts)
5. Clean up audio resources when navigating away

## Related Documentation

- [Web App Architecture](../components/web-architecture.md)
- [Environment Variables](../reference/environment-variables.md)
- [API Reference](../reference/api.md)
