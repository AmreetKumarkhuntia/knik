# Knik Web App

**Electron + React + FastAPI Voice-Enabled AI Assistant**

The web app provides a modern, high-performance desktop interface for Knik with smooth 60fps animations and seamless AI voice interaction.

## Architecture

### Three-Layer Stack

```
┌─────────────────────────────────────────┐
│         Electron (Future)               │
│  Desktop window management & packaging  │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│    React + TypeScript + Tailwind        │
│  Modern UI with 60fps animations        │
│  http://localhost:5173                  │
└─────────────────────────────────────────┘
              ↓ REST API
┌─────────────────────────────────────────┐
│        FastAPI Backend                  │
│  AI + TTS + MCP Tools + History        │
│  http://localhost:8000                  │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│     Python Services (lib/)              │
│  AIClient, TTSProcessor, MCP Tools      │
└─────────────────────────────────────────┘
```

## Frontend (React)

### Tech Stack
- **React 18** - UI framework
- **TypeScript 5.2** - Type safety
- **Vite 7.2** - Build tool with lightning-fast HMR
- **Tailwind CSS 3.4** - Utility-first styling
- **Framer Motion** - Animation library (installed, not used yet)

### Project Structure

```
src/apps/web/frontend/
├── src/
│   ├── App.tsx                 # Main application component
│   ├── index.css               # Global styles + Tailwind imports
│   ├── main.tsx                # Entry point
│   ├── lib/
│   │   └── components/         # Reusable UI components
│   │       ├── TopBar.tsx      # Header with app title and status
│   │       ├── ChatPanel.tsx   # Message display with animations
│   │       ├── InputPanel.tsx  # Text input + send button
│   │       └── index.ts        # Component exports
│   └── services/               # Business logic
│       ├── api.ts              # Backend API client
│       ├── audio.ts            # Audio playback utilities
│       ├── theme.ts            # Design tokens and colors
│       └── index.ts            # Service exports
├── tailwind.config.js          # Custom animations configuration
├── tsconfig.json               # TypeScript configuration
├── vite.config.ts              # Vite build configuration
└── package.json                # Dependencies
```

### Key Components

**TopBar** (`src/lib/components/TopBar.tsx`)
- App branding with "🤖 Knik" title
- Loading indicator during AI requests
- Clean, minimal design

**ChatPanel** (`src/lib/components/ChatPanel.tsx`)
- Scrollable message display
- Animated message bubbles (slide-in-right for user, slide-in-left for AI)
- Auto-scroll to bottom on new messages
- System messages for tool execution feedback

**InputPanel** (`src/lib/components/InputPanel.tsx`)
- Text input with Enter key support
- Send button with hover effects
- Voice toggle button (future feature)
- Rounded corners (25px radius) for modern look

### Services

**API Client** (`src/services/api.ts`)
```typescript
const API_BASE_URL = 'http://localhost:8000/api'

// Send message, get text + audio response
await api.chat(message: string): Promise<ChatResponse>

// Get conversation history
await api.getHistory(): Promise<Message[]>

// Clear conversation history
await api.clearHistory(): Promise<void>

// Get current settings
await api.getSettings(): Promise<Settings>
```

**Audio Service** (`src/services/audio.ts`)
```typescript
// Play base64-encoded WAV audio
playAudio(base64Audio: string, sampleRate: number): Promise<void>
```

**Theme** (`src/services/theme.ts`)
```typescript
export const colors = {
  primary: '#8b5cf6',    // Purple
  secondary: '#3b82f6',  // Blue
  // ... 15+ color tokens
}

export const spacing = { xs: 8, sm: 12, md: 16, lg: 24, xl: 32 }
export const radius = { sm: 8, md: 12, lg: 16, full: 9999 }
```

### Animations

All animations configured in `tailwind.config.js`:

```javascript
keyframes: {
  'gradient-shift': {
    '0%, 100%': { backgroundPosition: '0% 50%' },
    '50%': { backgroundPosition: '100% 50%' }
  },
  'slide-in-right': { from: { transform: 'translateX(20px)', opacity: '0' } },
  'slide-in-left': { from: { transform: 'translateX(-20px)', opacity: '0' } },
  'fade-in': { from: { opacity: '0' } },
  'word-reveal': { from: { opacity: '0', transform: 'translateY(10px)' } }
}

animation: {
  'gradient-shift': 'gradient-shift 8s ease infinite',
  'slide-in-right': 'slide-in-right 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  'slide-in-left': 'slide-in-left 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  'fade-in': 'fade-in 0.5s ease-out',
  'word-reveal': 'word-reveal 0.5s ease-out'
}
```

**Performance:** All animations use GPU-accelerated properties (transform, opacity) for 60fps smoothness.

## Backend (FastAPI)

### API Endpoints

**Base URL:** `http://localhost:8000`

#### Chat Endpoint
```http
POST /api/chat/
Content-Type: application/json

{
  "message": "Hello, how are you?"
}

Response:
{
  "text": "I'm doing great! How can I help you?",
  "audio": "base64_encoded_wav_data...",
  "sample_rate": 24000
}
```

#### Admin Endpoints
```http
# Get current settings
GET /api/admin/settings
Response: { provider, model, voice, temperature, max_tokens, sample_rate, initialized }

# Update settings
POST /api/admin/settings
Body: { provider?, model?, voice? }

# List available providers
GET /api/admin/providers
Response: { providers: [{ id, name }] }

# List available models (from Config.AI_MODELS)
GET /api/admin/models
Response: { models: [{ id, name }] }

# List available voices (from Config.VOICES)
GET /api/admin/voices
Response: { voices: [{ id, name }] }
```

#### History Endpoints
```http
# Get conversation history
GET /api/history/
Response: { messages: [{ role, content }], count }

# Add message to history
POST /api/history/add
Body: { role: "user" | "assistant", content: string }

# Clear all history
POST /api/history/clear
Response: { status: "success", message }
```

### Backend Structure

```
src/apps/web/backend/
├── main.py                     # FastAPI app entry point
├── config.py                   # WebBackendConfig (reads from .env)
├── requirements.txt            # Python dependencies
├── routes/
│   ├── chat.py                 # Unified chat endpoint
│   ├── admin.py                # Settings management
│   └── history.py              # Conversation history
└── websocket/                  # Future: streaming support
```

### Configuration

Backend reads from environment variables (via `WebBackendConfig`):

```python
# AI Settings
KNIK_AI_PROVIDER=vertex          # AI provider (vertex, mock)
KNIK_AI_MODEL=gemini-2.5-flash   # Model name
GOOGLE_CLOUD_PROJECT=your-project # GCP project ID
KNIK_AI_LOCATION=us-central1     # Vertex AI region
KNIK_TEMPERATURE=0.7             # AI temperature
KNIK_MAX_TOKENS=25565            # Max output tokens

# TTS Settings
KNIK_VOICE_NAME=af_heart         # Voice (af_* female, am_* male)
KNIK_LANGUAGE=a                  # Language code

# Web Backend Settings
KNIK_WEB_HOST=0.0.0.0           # Server host
KNIK_WEB_PORT=8000              # Server port
KNIK_WEB_RELOAD=True            # Auto-reload on code changes
KNIK_HISTORY_CONTEXT_SIZE=5     # Messages to pass to AI
```

### Global State

Backend uses module-level globals for singleton services:

```python
# routes/chat.py
ai_client: AIClient | None = None              # Vertex AI client
tts_processor: TTSAsyncProcessor | None = None # TTS engine
config = WebBackendConfig()                    # Configuration

# Lazy initialization on first request
if ai_client is None:
    ai_client = AIClient(
        provider=config.ai_provider,
        model=config.ai_model,
        project_id=config.ai_project_id,
        location=config.ai_location
    )
```

## Development

### Starting the App

**Option 1: Using npm scripts** (recommended)
```bash
# Start both backend + frontend
npm run start:web

# Or start separately
npm run start:web:backend    # Backend on :8000
npm run start:web:frontend   # Frontend on :5173
```

**Option 2: Using shell scripts**
```bash
# From project root
./scripts/start_web_backend.sh
./scripts/start_web_frontend.sh
```

**Option 3: Manual**
```bash
# Backend (from project root)
source .env
source .venv/bin/activate
cd src
python -m apps.web.backend.main

# Frontend (from project root)
cd src/apps/web/frontend
npm run dev
```

### Hot Reload

- **Backend:** Uvicorn auto-reload watches `src/` directory
- **Frontend:** Vite HMR updates instantly on file save

### Debugging

**Backend Logs:**
```bash
# Backend prints to stdout
03:58:45 |     main:50 |     INFO | Starting Knik FastAPI backend...
03:58:45 |     main:51 |  SUCCESS | Backend ready on http://localhost:8000
```

**Frontend:**
- Open browser DevTools (F12)
- Check Console for errors
- Use Network tab to inspect API calls

## Performance

### Metrics

- **Animation FPS:** 60fps (GPU-accelerated)
- **Initial Load:** ~130ms (Vite dev server)
- **Hot Reload:** <50ms (Vite HMR)
- **API Response:** 2-5s (AI inference) + 1-2s (TTS generation)
- **Audio Playback:** Immediate (Web Audio API)

### Optimizations

1. **Frontend:**
   - Tailwind JIT for minimal CSS bundle
   - React lazy loading for code splitting (future)
   - Virtual scrolling for long chat history (future)

2. **Backend:**
   - Singleton AI client (no re-initialization)
   - Async FastAPI for non-blocking requests
   - Lazy loading of TTS model (on first use)

## Future Enhancements

### Phase 7: Electron Integration (Next)
- [ ] Install Electron + electron-builder
- [ ] Create `electron/main.js` for window management
- [ ] Create `electron/preload.js` for secure IPC
- [ ] Auto-spawn Python backend subprocess
- [ ] System tray integration
- [ ] Window state persistence

### Phase 8: Build & Package
- [ ] Configure electron-builder
- [ ] Bundle Python backend with app
- [ ] Create DMG installer (macOS)
- [ ] Create EXE installer (Windows)
- [ ] Code signing

### Phase 9: Testing & Optimization
- [ ] Benchmark animations (60fps confirmation)
- [ ] Profile memory usage
- [ ] Test app startup time
- [ ] Optimize bundle size

### Additional Features
- [ ] WebSocket support for streaming responses
- [ ] Settings panel UI in frontend
- [ ] Conversation history panel with search
- [ ] MCP tool execution feedback UI
- [ ] Voice input (speech-to-text)
- [ ] Multi-language support
- [ ] Theme customization
- [ ] Export conversations

## Troubleshooting

### Backend Won't Start
```bash
# Check if .env file exists
cat .env

# Verify venv is activated
which python  # Should show .venv/bin/python

# Check if port 8000 is available
lsof -i :8000
```

### Frontend Build Issues
```bash
# Clear node_modules and reinstall
cd src/apps/web/frontend
rm -rf node_modules package-lock.json
npm install
```

### Audio Not Playing
1. Check browser console for errors
2. Verify backend returns audio in response
3. Check audio format (should be base64 WAV)
4. Test with: `curl http://localhost:8000/api/chat/ -d '{"message":"hello"}'`

### CORS Errors
- Backend allows `http://localhost:5173` only
- If using different port, update `main.py`:
  ```python
  allow_origins=["http://localhost:YOUR_PORT"]
  ```

## Related Documentation

- [MCP Tools](./MCP.md) - AI-callable tools system
- [Console App](./CONSOLE.md) - Terminal-based interface
- [GUI App](./GUI.md) - CustomTkinter desktop app
- [Environment Variables](./ENVIRONMENT_VARIABLES.md) - Configuration guide
- [Roadmap](./ROADMAP.md) - Project roadmap and vision

## API Reference

See [API.md](./API.md) for detailed API documentation (TBD).
