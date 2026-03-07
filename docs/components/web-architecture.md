# Knik Web App

**Electron + React + Tailwind CSS + Python Backend**

## 📁 Folder Structure

```mermaid
mindmap
  root((src/apps/web))
    backend
      main.py
      config.py
      routes
        chat.py
        tts.py
        tools.py
        history.py
        settings.py
      websocket
        stream.py
      models
        chat.py
        tts.py
        settings.py
    frontend
      package.json
      vite.config.ts
      tailwind.config.js
      postcss.config.js
      index.html
      src
        main.tsx
        App.tsx
        index.css
        lib
          components
            AudioControls.tsx
            BackgroundEffects.tsx
            ChatPanel.tsx
            HamburgerButton.tsx
            InputPanel.tsx
            Sidebar.tsx
          hooks
            useAudio.ts
            useChat.ts
            useKeyboardShortcuts.ts
            useToast.ts
          services
            api.ts
            streaming.ts
            theme.ts
            audio/
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

```mermaid
flowchart TD
    A[React Frontend Electron Window] -->|REST API / WebSocket| B[FastAPI Backend Python API Layer]
    B -->|Direct imports| C[Existing Knik Code AIClient TTSAsyncProcessor MCP Tools ConversationHistory]
    
    style A fill:#e1f5ff
    style B fill:#fff3e0
    style C fill:#e8f5e9
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
