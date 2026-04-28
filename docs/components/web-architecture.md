# Knik Web App Architecture

**React + Vite + Tailwind CSS + FastAPI Python Backend**

## Folder Structure

### Backend

```
src/apps/web/backend/
├── __init__.py
├── main.py              # FastAPI app setup, CORS, lifespan, route mounting
├── config.py            # WebBackendConfig (extends core Config)
├── state.py             # Shared mutable state (AIClient, MCPServerRegistry, TTS)
├── requirements.txt     # Backend-specific Python deps
├── models/
│   └── __init__.py      # (placeholder — Pydantic models remain inline in routes)
├── routes/
│   ├── __init__.py
│   ├── admin.py         # GET/POST /api/admin/settings
│   ├── analytics.py     # GET /api/analytics/* (dashboard, metrics, activity)
│   ├── chat.py          # POST /api/chat (non-streaming)
│   ├── chat_stream.py   # POST /api/chat/stream (SSE streaming)
│   ├── conversations.py # CRUD /api/conversations/* (persisted conversation history)
│   ├── cron.py          # CRUD /api/cron/* (scheduled tasks)
│   ├── history.py       # GET/POST /api/history (conversation history)
│   └── workflow.py      # CRUD /api/workflows/* (workflow management)
└── websocket/
    └── __init__.py      # (placeholder)
```

### Frontend

```
src/apps/web/frontend/
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── tsconfig.app.json    # Path aliases ($types, $components, etc.)
├── index.html
└── src/
    ├── main.tsx         # React entry point
    ├── App.tsx          # Router setup (6 routes)
    ├── index.css        # Tailwind imports + global styles
    ├── vite-env.d.ts
    ├── assets/
    │   └── react.svg
    ├── lib/
    │   ├── components/  # 29 reusable UI components
    │   │   ├── index.ts # Barrel exports
    │   │   ├── ActionButton.tsx
    │   │   ├── Backdrop.tsx
    │   │   ├── Breadcrumb.tsx
    │   │   ├── Card.tsx
    │   │   ├── ConfirmDialog.tsx
    │   │   ├── EmptyState.tsx
    │   │   ├── ExecutionFlowGraph.tsx
    │   │   ├── ExecutionTimeline.tsx
    │   │   ├── FormField.tsx
    │   │   ├── HamburgerButton.tsx
    │   │   ├── IconButton.tsx
    │   │   ├── Input.tsx
    │   │   ├── LinkButton.tsx
    │   │   ├── LoadingSpinner.tsx
    │   │   ├── MarkdownMessage.tsx
    │   │   ├── MetricCard.tsx
    │   │   ├── Modal.tsx
    │   │   ├── NavLink.tsx
    │   │   ├── NotificationButton.tsx
    │   │   ├── PageHeader.tsx
    │   │   ├── Pagination.tsx
    │   │   ├── SearchBar.tsx
    │   │   ├── SectionHeader.tsx
    │   │   ├── StatusBadge.tsx
    │   │   ├── StructuredOutput.tsx
    │   │   ├── Table.tsx
    │   │   ├── Tabs.tsx
    │   │   ├── ToggleSwitch.tsx
    │   │   ├── UserProfile.tsx
    │   │   ├── graph/           # ReactFlow graph components
    │   │   │   ├── FlowCanvas.tsx
    │   │   │   ├── edges/FlowEdge.tsx
    │   │   │   └── nodes/BaseNode.tsx, NodeContent.tsx
    │   │   └── icons/
    │   │       └── Icons.tsx    # MenuIcon, PlayIcon, PauseIcon, etc.
    │   ├── constants/           # UI constants, themes, node types
    │   │   ├── config.ts
    │   │   ├── defaults.ts
    │   │   ├── dimensions.ts
    │   │   ├── navigation.ts
    │   │   ├── nodes.ts
    │   │   ├── status.ts
    │   │   ├── themes.ts
    │   │   ├── ui.ts
    │   │   └── variants.ts
    │   ├── data-structures/     # Graph data structures (d3-force layout)
    │   │   ├── core/GraphNode.ts
    │   │   ├── structures/Graph.ts
    │   │   ├── layout/GraphLayout.ts
    │   │   └── adapters/        # canvasAdapter, graphAdapter, workflowAdapter
    │   ├── hooks/
    │   │   ├── index.ts
    │   │   ├── useKeyboardShortcuts.ts
    │   │   └── useTheme.ts
    │   ├── pages/               # Top-level route pages
    │   │   ├── Home.tsx
    │   │   ├── Workflows.tsx
    │   │   ├── WorkflowBuilder.tsx
    │   │   ├── ExecutionDetail.tsx
    │   │   └── AllExecutions.tsx
    │   ├── sections/            # App-specific section components
    │   │   ├── audio/AudioControls.tsx
    │   │   ├── chat/ChatPanel.tsx, InputPanel.tsx
    │   │   ├── effects/BackgroundEffects.tsx
    │   │   ├── feedback/ErrorBoundary.tsx, Toast.tsx
    │   │   ├── home/WelcomeContainer.tsx, SuggestionCards.tsx, ...
    │   │   ├── layout/MainLayout.tsx, Sidebar.tsx, TopBar.tsx
    │   │   ├── theme/ThemeProvider.tsx, ThemeSelector.tsx, ThemeToggle.tsx
    │   │   └── workflows/
    │   │       ├── WorkflowHub.tsx, WorkflowsTable.tsx
    │   │       ├── ExecutionHistory/
    │   │       ├── ScheduleManager/
    │   │       └── WorkflowBuilder/Canvas.tsx, FloatingControls, ...
│   └── utils/
│       ├── format.ts
│       ├── metricsCalculator.ts
│       └── uuid.ts
    ├── services/
    │   ├── api.ts               # ChatAPI, ConversationAPI, AdminAPI
    │   ├── streaming.ts         # streamChat() SSE client
    │   ├── workflowApi.ts       # WorkflowAPI, ScheduleAPI, AnalyticsAPI
    │   ├── theme.ts
    │   └── audio/
    │       ├── queue.ts         # queueAudio(), clearAudioQueue()
    │       ├── playback.ts      # playAudio(), pauseAudio(), etc.
    │       └── mediaSession.ts  # Browser Media Session API
    ├── store/                   # Zustand state management
    │   ├── index.ts             # Root store (useStore)
    │   ├── audioSlice.ts        # Audio playback state
    │   ├── chatSlice.ts         # Chat message state
    │   └── toastSlice.ts        # Toast notification state
    └── types/
        ├── api.ts, common.ts, components.ts, workflow.ts, ...
        └── sections/            # Per-section type definitions
```

## Architecture

```
┌────────────────────────┐     REST / SSE     ┌──────────────────────┐
│  React Frontend        │ ←────────────────→ │  FastAPI Backend     │
│  (Vite dev: port 5173) │                    │  (Uvicorn: port 8000)│
│                        │                    │                      │
│  - 5 pages (Router)    │                    │  - 8 route files     │
│  - 29 components       │                    │  - AIClient          │
│  - SSE streaming       │                    │  - TTSAsyncProcessor │
│  - Audio playback      │                    │  - MCP tools         │
│  - Theme system        │                    │  - ConversationHist  │
└────────────────────────┘                    └──────────────────────┘
                                                       │
                                               Direct Python imports
                                                       │
                                              ┌────────┴────────┐
                                              │  src/lib/        │
                                              │  Core Knik Code  │
                                              │  (shared w/ all  │
                                              │   app modes)     │
                                              └─────────────────┘
```

## Backend Integration

The backend imports existing Knik functionality directly -- no duplication:

```python
# backend/routes/chat.py
from imports import AIClient, ConversationHistory
from lib.services.ai_client.registry import MCPServerRegistry
```

**No changes needed to:**

- `src/lib/` -- core logic, services, MCP tools
- `src/apps/console/` -- console app
- `imports.py` -- central import hub

> **Note:** The `src/lib/services/messaging_client/` module is a shared service primarily used by Bot app (`src/apps/bot/`). It provides a provider-agnostic messaging abstraction with implementations for Telegram and mock testing. See [API Reference](../reference/api.md) for `MessagingClient` documentation.

## Frontend Routes

| Path                    | Page              | Description                         |
| ----------------------- | ----------------- | ----------------------------------- |
| `/`                     | `Home`            | Chat interface with audio streaming |
| `/workflows`            | `Workflows`       | Workflow listing and management     |
| `/workflows/create`     | `WorkflowBuilder` | Create a new workflow               |
| `/workflows/:id/edit`   | `WorkflowBuilder` | Edit existing workflow              |
| `/workflows/executions` | `AllExecutions`   | All execution history               |
| `/executions/:id`       | `ExecutionDetail` | Single execution detail             |

## Frontend-to-Backend API Mapping

| Frontend Service         | Backend Route                           | Purpose                                 |
| ------------------------ | --------------------------------------- | --------------------------------------- |
| `ChatAPI.stream()`       | `chat_stream.py` `/api/chat/stream`     | SSE streaming chat + audio              |
| `ChatAPI.getHistory()`   | `history.py` `/api/history`             | Get conversation history                |
| `ChatAPI.clearHistory()` | `history.py` `/api/history/clear`       | Clear history                           |
| `ConversationAPI.*`      | `conversations.py` `/api/conversations` | CRUD for persisted conversation history |
| `AdminAPI.getSettings()` | `admin.py` `/api/admin/settings`        | Get server settings                     |
| `WorkflowAPI.*`          | `workflow.py` `/api/workflows`          | Workflow CRUD + execution               |
| `ScheduleAPI.*`          | `cron.py` `/api/cron`                   | Cron schedule management                |
| `AnalyticsAPI.*`         | `analytics.py` `/api/analytics`         | Dashboard, metrics, activity            |

> The non-streaming `chat.py` endpoint (`POST /api/chat`) exists in the backend but is not consumed by the frontend.

## Development

### Backend Only

```bash
npm run start:web:backend
# Starts FastAPI on http://localhost:8000
```

### Frontend Only

```bash
npm run start:web:frontend
# Starts Vite dev server on http://localhost:12414
```

### Bot App

```bash
python src/main.py --mode bot
# Starts long-running bot daemon
```

### Full Stack (Separate Terminals)

```bash
# Terminal 1
npm run start:web:backend

# Terminal 2
npm run start:web:frontend
```

### With Electron

```bash
npm run electron:dev
# Starts backend + frontend + Electron concurrently
```

## Configuration

Backend defaults are in `src/apps/web/backend/config.py`:

| Setting         | Env Variable                | Default   |
| --------------- | --------------------------- | --------- |
| Host            | `KNIK_WEB_HOST`             | `0.0.0.0` |
| Port            | `KNIK_WEB_PORT`             | `8000`    |
| Hot Reload      | `KNIK_WEB_RELOAD`           | `True`    |
| History Context | `KNIK_HISTORY_CONTEXT_SIZE` | `5`       |

See [environment-variables.md](../reference/environment-variables.md) for the full reference.
