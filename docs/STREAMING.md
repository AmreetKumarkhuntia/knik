# Streaming Architecture

This document describes the real-time streaming system for text and audio responses.

## Overview

The streaming system delivers AI responses progressively:
1. **Text streams immediately** - Users see text as it's generated (token by token)
2. **Audio streams progressively** - Audio chunks generated and delivered as sentences complete
3. **Non-blocking architecture** - Leverages async processing for smooth UX

## Architecture

### Flow Diagram

```
User Message
    ↓
FastAPI Endpoint (/api/chat/stream)
    ↓
AI Client (chat_stream) → Text Chunks
    ↓                          ↓
    |                    SSE: event=text
    |                          ↓
    └─→ TTSAsyncProcessor  Frontend
            ↓
        Audio Queue (callback)
            ↓
       SSE: event=audio
            ↓
        Frontend Playback
```

### Components

#### 1. TTSAsyncProcessor (Enhanced)

**Location:** `src/lib/core/tts_async_processor.py`

**Key Changes:**
- Added `audio_ready_callback` parameter to constructor
- Callback invoked in `__audio_processor__` when audio chunk ready
- `play_voice=False` for web backend (frontend handles playback)

**Usage:**
```python
def audio_ready_callback(audio_data: bytes, sample_rate: int):
    # Stream to frontend via SSE
    audio_queue.put((audio_data, sample_rate))

tts = TTSAsyncProcessor(
    voice_model="af_sarah",
    sample_rate=24000,
    play_voice=False,  # No local playback
    audio_ready_callback=audio_ready_callback
)
tts.start_async_processing()
tts.play_async("Hello world")  # Audio ready → callback called
```

#### 2. Streaming Endpoint

**Location:** `src/apps/web/backend/routes/chat_stream.py`

**Endpoint:** `POST /api/chat/stream`

**Technology:** Server-Sent Events (SSE)

**Event Types:**
- `text` - Text chunk from AI
- `audio` - Base64 encoded WAV audio chunk
- `done` - Streaming complete (includes audio chunk count)
- `error` - Error message

**Request:**
```json
{
  "message": "Tell me a joke"
}
```

**Response Stream:**
```
event: text
data: Why

event: text
data:  did

event: text
data:  the

event: audio
data: UklGRiQAAABXQVZFZm10IBAA...

event: text
data:  chicken

event: done
data: 5
```

**Key Features:**
- Sentence-based audio chunking (splits on `.`, `!`, `?`, `\n`)
- Audio queue with callback system
- Timeout protection (30s max)
- Automatic cleanup after streaming

#### 3. Frontend Client

**Location:** `src/apps/web/frontend/src/services/streaming.ts`

**Main Function:** `streamChat(message, callbacks)`

**Usage:**
```typescript
import { streamChat, playBase64Audio } from './services/streaming';

const source = streamChat("Hello!", {
  onText: (chunk) => {
    // Append to UI immediately
    appendToChat(chunk);
  },
  onAudio: (audioBase64) => {
    // Play audio chunk
    playBase64Audio(audioBase64);
  },
  onComplete: (count) => {
    console.log(`Done! ${count} audio chunks`);
  },
  onError: (error) => {
    console.error(error);
  }
});

// Cancel streaming
source.close();
```

**React Hook:** `useStreamingChat()`
```typescript
const { sendMessage, cancelStream, isStreaming, fullText } = useStreamingChat();

sendMessage("What's the weather?");
```

## Implementation Details

### Sentence-Based Chunking

Audio generation happens at sentence boundaries for natural pacing:

```python
text_buffer = ""
sentence_endings = [".", "!", "?", "\n"]

for text_chunk in ai_client.chat_stream(prompt):
    yield f"event: text\ndata: {text_chunk}\n\n"
    
    text_buffer += text_chunk
    
    for ending in sentence_endings:
        if ending in text_buffer:
            parts = text_buffer.split(ending, 1)
            sentence = parts[0] + ending
            text_buffer = parts[1] if len(parts) > 1 else ""
            
            tts_processor.play_async(sentence.strip())
            break
```

### Audio Callback Pattern

The callback bridges TTS generation and SSE streaming:

```python
audio_queue = Queue()

def audio_ready_callback(audio_data, sample_rate):
    audio_queue.put((audio_data, sample_rate))

# Set callback
tts_processor.set_audio_ready_callback(audio_ready_callback)

# Stream audio as ready
while not tts_processor.is_processing_complete():
    if not audio_queue.empty():
        audio, sr = audio_queue.get()
        audio_base64 = encode_to_base64(audio, sr)
        yield f"event: audio\ndata: {audio_base64}\n\n"
```

### Client-Side Audio Playback

Frontend converts base64 to playable audio:

```typescript
function playBase64Audio(audioBase64: string) {
  // Decode base64
  const binaryString = atob(audioBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  // Create audio blob
  const blob = new Blob([bytes], { type: 'audio/wav' });
  const url = URL.createObjectURL(blob);
  
  // Play
  const audio = new Audio(url);
  audio.play();
  
  // Cleanup
  audio.onended = () => URL.revokeObjectURL(url);
}
```

## Configuration

**Backend Config** (`src/apps/web/backend/config.py`):
```python
class WebBackendConfig:
    voice_name: str = "af_sarah"
    sample_rate: int = 24000
    ai_provider: str = "vertex"
    ai_model: str = "gemini-1.5-pro"
```

**Environment Variables:**
- `KNIK_VOICE_NAME` - TTS voice (default: af_sarah)
- `KNIK_SAMPLE_RATE` - Audio sample rate (default: 24000)
- `KNIK_AI_PROVIDER` - AI provider (default: vertex)
- `KNIK_AI_MODEL` - Model name (default: gemini-1.5-pro)

## Testing

### Backend Test

```bash
# Start backend
npm run start:web:backend

# Test with curl (SSE stream)
curl -N -X POST http://localhost:8000/api/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"message": "Tell me a short joke"}'
```

### Frontend Test

```bash
# Start frontend
npm run start:web:frontend

# Open browser console and test
const source = streamChat("Hello!", {
  onText: (chunk) => console.log("Text:", chunk),
  onAudio: (audio) => console.log("Audio:", audio.length, "bytes"),
  onComplete: (count) => console.log("Done:", count, "chunks")
});
```

## Comparison: Stream vs Non-Stream

### Non-Stream Endpoint (`/api/chat`)

**Pros:**
- Simpler implementation
- Single response (text + audio)
- Easier error handling

**Cons:**
- Slower perceived response (wait for full generation)
- No progressive feedback
- Higher memory usage (full audio in memory)

### Stream Endpoint (`/api/chat/stream`)

**Pros:**
- Instant feedback (text appears immediately)
- Progressive audio (plays while generating)
- Lower memory footprint (streaming chunks)
- Better UX (feels faster and more responsive)

**Cons:**
- More complex implementation
- SSE connection management
- Requires careful cleanup

## Performance Considerations

### Backend

- **Memory:** Streaming reduces peak memory (chunks vs full audio)
- **Latency:** Text appears ~100-300ms faster than non-stream
- **Throughput:** Can handle more concurrent users (no blocking)

### Frontend

- **Network:** SSE maintains long-lived connection (efficient for streams)
- **UI Responsiveness:** Non-blocking UI (streaming keeps page interactive)
- **Audio Buffering:** Browser handles audio queue automatically

## Best Practices

1. **Always set `play_voice=False`** for web backend
2. **Clean up callback** after streaming completes
3. **Handle timeout** (max 30s for audio generation)
4. **Close EventSource** on component unmount (React)
5. **Provide loading state** during streaming
6. **Handle errors gracefully** (network issues, timeouts)

## Future Enhancements

### Priority 1
- [ ] Adaptive chunking (based on network speed)
- [ ] Audio compression (reduce bandwidth)
- [ ] Retry logic for failed chunks

### Priority 2
- [ ] Multi-voice support (dynamic voice switching)
- [ ] Real-time speed adjustment
- [ ] WebSocket alternative (bidirectional streaming)

### Priority 3
- [ ] Audio caching (avoid regenerating same text)
- [ ] Client-side audio stitching (smoother playback)
- [ ] Metrics and monitoring (latency, chunk sizes)

## Troubleshooting

### Stream doesn't start
- Check CORS settings (allow `text/event-stream`)
- Verify EventSource browser support
- Check network tab for SSE connection

### Audio doesn't play
- Verify audio format (WAV)
- Check base64 encoding/decoding
- Ensure autoplay policy compliance

### Stream hangs
- Check timeout settings (30s default)
- Verify `is_processing_complete()` logic
- Look for exceptions in audio callback

### Missing audio chunks
- Check audio queue size (may be full)
- Verify callback is set before `play_async()`
- Ensure TTS processor is started

## Related Documentation

- [Web App Architecture](WEB_APP.md)
- [TTS Async Processor](../src/lib/core/tts_async_processor.py)
- [FastAPI SSE Guide](https://fastapi.tiangolo.com/advanced/custom-response/#streamingresponse)
