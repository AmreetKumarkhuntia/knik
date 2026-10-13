# Knik Web App

Modern web interface with React + FastAPI for AI chat, workflow management, and scheduling.

## Architecture

### Three-Layer Stack

```mermaid
flowchart TD
    A[Electron Desktop Window Management] --> B[React TypeScript Tailwind UI Port 8020]
    B -->|REST API| C[FastAPI Backend AI TTS MCP Tools Port 8000]
    C -->|Direct imports| D[Python Services AIClient TTSProcessor MCP Tools]

    style A fill:#e1f5ff
    style B fill:#f3e5f5
    style C fill:#fff3e0
    style D fill:#e8f5e9
```

## Frontend (React)

### Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool with lightning-fast HMR
- **Tailwind CSS** - Utility-first styling

### Project Structure

```
src/apps/web/frontend/src/
  App.tsx                  # Main layout orchestrator
  main.tsx                 # Entry point
  types/                   # TypeScript type definitions
  lib/
    pages/                 # Route-level pages
      Settings.tsx
      WorkflowBuilder.tsx
      ExecutionDetail.tsx
    widgets/               # Bind store state and actions to components
    stores/                # Provider-scoped Zustand domain stores
    components/            # Presentational UI, grouped by family
      buttons, chat, display, forms, graph, navigation, surfaces, etc.
    hooks/                 # useKeyboardShortcuts, useViewport
    constants/
    data-structures/
    utils/
```

## Backend (FastAPI)

### API Endpoints (32 total)

**Base URL:** `http://localhost:8010`

| Route File         | Prefix               | Endpoints                                                                                                                               |
| ------------------ | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `chat.py`          | `/api/chat`          | POST `/`                                                                                                                                |
| `chat_stream.py`   | `/api/chat/stream`   | POST `/`                                                                                                                                |
| `admin.py`         | `/api/admin`         | GET/POST `/settings`, GET `/providers`, `/models`, `/voices`                                                                            |
| `history.py`       | `/api/history`       | GET `/`, POST `/add`, POST `/clear`                                                                                                     |
| `workflow.py`      | `/api/workflows`     | GET `/`, GET/DELETE `/{id}`, POST `/{id}/execute`, GET `/{id}/history`, GET `/{id}/executions/{eid}/nodes`                              |
| `cron.py`          | `/api/cron`          | GET `/`, POST `/`, DELETE `/{id}`, PATCH `/{id}/toggle`                                                                                 |
| `analytics.py`     | `/api/analytics`     | GET `/dashboard`, `/metrics`, `/top-workflows`, `/executions`, `/workflows/list`, `/activity`                                           |
| `conversations.py` | `/api/conversations` | GET `/`, POST `/`, GET `/{conversation_id}`, DELETE `/{conversation_id}`, PATCH `/{conversation_id}`, GET `/{conversation_id}/messages` |

See [API Reference](../reference/api.md) for detailed endpoint documentation.

### Backend Structure

```
src/apps/web/backend/
  main.py           # FastAPI app entry point with CORS, lifespan handlers
  config.py         # WebBackendConfig (reads from .env)
    routes/
    chat.py         # Chat endpoint (text + audio response)
    chat_stream.py  # SSE streaming chat endpoint
    admin.py        # Settings and provider management
    history.py      # Conversation history CRUD
    workflow.py     # Workflow CRUD and execution
    conversations.py  # Conversation management with messages
    cron.py         # Schedule management (natural language)
    analytics.py    # Dashboard, metrics, activity
```

### Configuration

Backend reads from environment variables (via `WebBackendConfig`):

```bash
KNIK_AI_PROVIDER=vertex          # AI provider
KNIK_AI_MODEL=gemini-2.5-flash   # Model name
GOOGLE_CLOUD_PROJECT=your-project # GCP project ID
KNIK_AI_LOCATION=us-central1     # Vertex AI region
KNIK_TEMPERATURE=0.7             # AI temperature
KNIK_MAX_TOKENS=25565            # Max output tokens
KNIK_VOICE=af_heart              # Voice name
KNIK_LANGUAGE=a                  # Language code
KNIK_WEB_HOST=0.0.0.0           # Server host
KNIK_WEB_PORT=8000              # Server port
KNIK_WEB_RELOAD=true            # Auto-reload
KNIK_HISTORY_CONTEXT_SIZE=5     # Context messages for AI
```

See [Environment Variables](../reference/environment-variables.md) for all options.

## Development

### Starting the App

```bash
# Start backend and frontend separately (two terminals)
npm run start:web:backend    # Backend on :8000
npm run start:web:frontend   # Frontend on :8020 (Vite dev port)

# Or use shell scripts
./scripts/start_web_backend.sh
./scripts/start_web_frontend.sh
```

There is no combined `npm run start:web` script — you must start backend and frontend separately.

### Hot Reload

- **Backend:** Uvicorn auto-reload watches `src/` directory
- **Frontend:** Vite HMR updates instantly on file save

### Electron Desktop App

The web app can be wrapped in Electron for desktop distribution:

```bash
npm run start:electron    # Development mode
npm run electron:dev      # Runs backend + frontend + electron concurrently
npm run electron:build    # Build for current platform
```

See [Electron Guide](electron.md) for details.

## Troubleshooting

### Backend Won't Start

```bash
cat .env                  # Check if .env file exists
which python              # Should show .venv/bin/python
lsof -i :8000            # Check if port is available
```

### Frontend Build Issues

```bash
cd src/apps/web/frontend
rm -rf node_modules package-lock.json
npm install
```

### CORS Errors

The backend allows `http://localhost:8020` and `http://127.0.0.1:8020` by default. For another origin, set `KNIK_WEB_CORS_ORIGINS` (comma-separated), e.g. `export KNIK_WEB_CORS_ORIGINS=http://localhost:YOUR_PORT`.

## Related Documentation

- [MCP Tools](mcp.md) - AI-callable tools system
- [Console App](console.md) - Terminal-based interface
- [Scheduler](scheduler.md) - Workflow scheduling system
- [API Reference](../reference/api.md) - Detailed API docs
- [Environment Variables](../reference/environment-variables.md) - Configuration guide
