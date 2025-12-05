# Knik Web App

**Electron + React + Tailwind CSS + Python Backend**

## 📁 Folder Structure

```
src/apps/web/
├── backend/                    # Python FastAPI backend
│   ├── __init__.py
│   ├── main.py                 # FastAPI app entry point
│   ├── config.py               # Backend configuration
│   ├── routes/                 # API endpoints
│   │   ├── __init__.py
│   │   ├── chat.py             # Chat with AI
│   │   ├── tts.py              # Text-to-speech
│   │   ├── tools.py            # MCP tools
│   │   ├── history.py          # Conversation history
│   │   └── settings.py         # App settings
│   ├── websocket/              # Real-time communication
│   │   ├── __init__.py
│   │   └── stream.py           # Streaming responses
│   └── models/                 # Pydantic models
│       ├── __init__.py
│       ├── chat.py
│       ├── tts.py
│       └── settings.py
│
└── frontend/                   # React + Tailwind frontend
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── index.html
    └── src/
        ├── main.tsx            # Entry point
        ├── App.tsx             # Root component
        ├── index.css           # Tailwind imports
        ├── components/         # React components
        │   ├── GradientBackground.tsx
        │   ├── ChatPanel.tsx
        │   ├── MessageBubble.tsx
        │   ├── InputPanel.tsx
        │   ├── SettingsPanel.tsx
        │   └── TopBar.tsx
        ├── hooks/              # Custom React hooks
        │   ├── useChat.ts
        │   ├── useTTS.ts
        │   └── useTheme.ts
        ├── services/           # API clients
        │   ├── api.ts
        │   └── websocket.ts
        ├── store/              # State management
        │   ├── chatStore.ts
        │   ├── settingsStore.ts
        │   └── themeStore.ts
        └── types/              # TypeScript types
            ├── message.ts
            ├── settings.ts
            └── api.ts
```

## 🔗 Integration with Existing Code

### **Backend Uses Existing Python Logic:**

All existing Knik functionality is accessed via imports:

```python
# backend/routes/chat.py
from imports import AIClient, ConversationHistory
from lib.services.ai_client.registry import MCPServerRegistry
```

**No changes to:**
- `src/lib/` - Core logic, services, MCP tools
- `src/apps/console/` - Console app
- `imports.py` - Central import hub

### **Architecture:**

```
┌─────────────────────────────────────┐
│   React Frontend (Electron Window)  │
│   - Tailwind CSS animations         │
│   - 60fps smooth UI                 │
└───────────┬─────────────────────────┘
            │ REST API / WebSocket
            ↓
┌─────────────────────────────────────┐
│   FastAPI Backend (Python)          │
│   - API layer for existing code     │
└───────────┬─────────────────────────┘
            │ Direct imports
            ↓
┌─────────────────────────────────────┐
│   Existing Knik Code (Unchanged)    │
│   - AIClient                        │
│   - TTSAsyncProcessor               │
│   - MCP Tools                       │
│   - ConversationHistory             │
└─────────────────────────────────────┘
```

## 🚀 Development

### **Backend Development:**
```bash
cd src/apps/web/backend
pip install fastapi uvicorn websockets
uvicorn main:app --reload --port 8000
```

### **Frontend Development:**
```bash
cd src/apps/web/frontend
npm install
npm run dev
```

### **Full Stack:**
```bash
# From project root
npm run dev
```

## 📝 Next Steps

1. ✅ **Folder structure created**
2. ⏳ Setup frontend (React + Vite + Tailwind)
3. ⏳ Create FastAPI backend with existing logic
4. ⏳ Build React UI components
5. ⏳ Implement smooth CSS animations
6. ⏳ Connect frontend to backend
7. ⏳ Setup Electron wrapper
8. ⏳ Package and test

---

**Status:** Phase 1 - Todo 1 Complete ✅
